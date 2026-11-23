import { requireOwnCaregiver } from '../_shared/caregiverAccess.ts'
import {
  TrainingError,
  appliesToRole,
  assignTrainings,
  trainingCorsHeaders,
  trainingErrorResponse,
  trainingJson,
} from '../_shared/training.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: trainingCorsHeaders })

  try {
    const body = await req.json()
    const { supabase, caregiver } = await requireOwnCaregiver(req)

    if (caregiver.status !== 'completed') {
      throw new TrainingError('Finish onboarding to access your training', 403)
    }

    const caregiverId = caregiver.id
    const companyId = caregiver.company_id
    const role = String(caregiver.role || '')

    const loadAssignment = async (trainingId: unknown) => {
      if (typeof trainingId !== 'string' || !trainingId) throw new TrainingError('trainingId is required')

      const { data: training, error } = await supabase
        .from('trainings')
        .select('id, title, description, passing_score, due_days, roles, is_published')
        .eq('id', trainingId)
        .eq('company_id', companyId)
        .maybeSingle()
      if (error) throw error
      if (!training || !training.is_published || !appliesToRole(training, role)) {
        throw new TrainingError('Training not found', 404)
      }

      await assignTrainings(supabase, { id: caregiverId, company_id: companyId, role })

      const { data: assignment, error: assignmentError } = await supabase
        .from('caregiver_trainings')
        .select('*')
        .eq('caregiver_id', caregiverId)
        .eq('training_id', training.id)
        .maybeSingle()
      if (assignmentError) throw assignmentError
      if (!assignment) throw new TrainingError('Training not found', 404)

      return { training, assignment }
    }

    switch (body.action) {
      case 'list': {
        await assignTrainings(supabase, { id: caregiverId, company_id: companyId, role })

        const { data: rows, error } = await supabase
          .from('caregiver_trainings')
          .select('id, training_id, status, due_date, completed_at, attempts, trainings(title, description, passing_score, roles, is_published, training_order)')
          .eq('caregiver_id', caregiverId)
        if (error) throw error

        const visible = (rows || [])
          .filter((r: any) => r.trainings && (r.trainings.is_published || r.status === 'passed') && appliesToRole(r.trainings, role))
          .map((r: any) => ({
            id: r.id,
            training_id: r.training_id,
            title: r.trainings.title,
            description: r.trainings.description,
            training_order: r.trainings.training_order,
            status: r.status,
            due_date: r.due_date,
            completed_at: r.completed_at,
            attempts: r.attempts,
          }))
          .sort((a: any, b: any) => a.training_order - b.training_order)

        return trainingJson(visible)
      }

      case 'get': {
        const { training, assignment } = await loadAssignment(body.trainingId)

        const [{ data: slides, error: slidesError }, { data: questions, error: questionsError }] = await Promise.all([
          supabase
            .from('training_slides')
            .select('id, title, body, image_path, video_url')
            .eq('training_id', training.id)
            .order('slide_order', { ascending: true }),
          supabase
            .from('training_questions')
            .select('id, question_text, options')
            .eq('training_id', training.id)
            .order('question_order', { ascending: true }),
        ])
        if (slidesError) throw slidesError
        if (questionsError) throw questionsError

        return trainingJson({
          training: {
            id: training.id,
            title: training.title,
            description: training.description,
            passing_score: training.passing_score,
          },
          slides: slides || [],
          questions: questions || [],
          progress: {
            status: assignment.status,
            current_slide: assignment.current_slide,
            attempts: assignment.attempts,
            due_date: assignment.due_date,
          },
        })
      }

      case 'progress': {
        const { assignment } = await loadAssignment(body.trainingId)
        if (assignment.status === 'passed') return trainingJson({ success: true })

        const slide = Number(body.currentSlide)
        if (!Number.isInteger(slide) || slide < 0) throw new TrainingError('currentSlide must be a non-negative integer')

        const { error } = await supabase
          .from('caregiver_trainings')
          .update({ status: 'in_progress', current_slide: slide })
          .eq('id', assignment.id)
        if (error) throw error
        return trainingJson({ success: true })
      }

      case 'submit': {
        const { training, assignment } = await loadAssignment(body.trainingId)

        const { data: questions, error } = await supabase
          .from('training_questions')
          .select('id, correct_answer_index')
          .eq('training_id', training.id)
          .order('question_order', { ascending: true })
        if (error) throw error

        const total = (questions || []).length
        const answers = Array.isArray(body.answers) ? body.answers : []
        if (total > 0 && answers.length !== total) throw new TrainingError('Answer every question before submitting')

        const score = (questions || []).reduce(
          (sum, q, i) => sum + (Number(answers[i]) === q.correct_answer_index ? 1 : 0),
          0
        )
        const passed = total === 0 || score * 100 >= training.passing_score * total

        if (assignment.status === 'passed') {
          return trainingJson({ passed: true, score, total, passing_score: training.passing_score })
        }

        const update: Record<string, unknown> = {
          attempts: assignment.attempts + 1,
          last_score: score,
          last_total: total,
          status: passed ? 'passed' : 'in_progress',
        }
        if (passed) {
          update.completed_at = new Date().toISOString()
          update.marked_by_admin = false
          update.marked_by = null
          update.marked_by_name = null
        }

        const { error: updateError } = await supabase
          .from('caregiver_trainings')
          .update(update)
          .eq('id', assignment.id)
        if (updateError) throw updateError

        return trainingJson({ passed, score, total, passing_score: training.passing_score })
      }

      default:
        throw new TrainingError('Unknown action')
    }
  } catch (err) {
    return trainingErrorResponse(err)
  }
})
