import {
  CAREGIVER_ROLES,
  TrainingError,
  assignTrainings,
  isValidHttpsUrl,
  requireTrainingAdmin,
  trainingCorsHeaders,
  trainingErrorResponse,
  trainingJson,
} from '../_shared/training.ts'

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function validateTraining(input: any) {
  if (!input || typeof input !== 'object') throw new TrainingError('training is required')

  const title = cleanText(input.title, 200)
  if (!title) throw new TrainingError('Title is required')

  const passingScore = Number(input.passing_score)
  if (!Number.isInteger(passingScore) || passingScore < 1 || passingScore > 100) {
    throw new TrainingError('Passing score must be a whole number between 1 and 100')
  }

  let dueDays: number | null = null
  if (input.due_days !== null && input.due_days !== undefined && input.due_days !== '') {
    dueDays = Number(input.due_days)
    if (!Number.isInteger(dueDays) || dueDays < 1 || dueDays > 3650) {
      throw new TrainingError('Due days must be a whole number of days, or left blank')
    }
  }

  const roles = Array.isArray(input.roles) ? input.roles : []
  if (roles.some((r: unknown) => typeof r !== 'string' || !CAREGIVER_ROLES.includes(r))) {
    throw new TrainingError('Invalid role selected')
  }

  const slides = Array.isArray(input.slides) ? input.slides : []
  const cleanSlides = slides.map((s: any, i: number) => {
    const slide = {
      title: cleanText(s?.title, 200) || null,
      body: typeof s?.body === 'string' && s.body.trim() ? s.body.slice(0, 20000) : null,
      image_path: cleanText(s?.image_path, 500) || null,
      video_url: cleanText(s?.video_url, 1000) || null,
    }
    if (!slide.title && !slide.body && !slide.image_path && !slide.video_url) {
      throw new TrainingError(`Slide ${i + 1} is empty. Add a title, text, image or video, or remove it.`)
    }
    if (slide.video_url && !isValidHttpsUrl(slide.video_url)) {
      throw new TrainingError(`Slide ${i + 1}: the video link must start with https://`)
    }
    return slide
  })

  const questions = Array.isArray(input.questions) ? input.questions : []
  const cleanQuestions = questions.map((q: any, i: number) => {
    const text = cleanText(q?.question_text, 1000)
    if (!text) throw new TrainingError(`Question ${i + 1} needs question text`)
    const options = Array.isArray(q?.options) ? q.options.map((o: unknown) => cleanText(o, 500)) : []
    if (options.length < 2 || options.some((o: string) => !o)) {
      throw new TrainingError(`Question ${i + 1} needs at least two options, all with text`)
    }
    const correct = Number(q?.correct_answer_index)
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
      throw new TrainingError(`Question ${i + 1} needs a correct answer`)
    }
    return { question_text: text, options, correct_answer_index: correct }
  })

  return {
    fields: {
      title,
      description: cleanText(input.description, 2000),
      passing_score: passingScore,
      due_days: dueDays,
      roles,
      is_published: Boolean(input.is_published),
    },
    slides: cleanSlides,
    questions: cleanQuestions,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: trainingCorsHeaders })

  try {
    const body = await req.json()
    const { action } = body
    const ctx = await requireTrainingAdmin(req, body.companyId)
    const { supabase, companyId } = ctx

    const loadTraining = async (id: unknown) => {
      if (typeof id !== 'string' || !id) throw new TrainingError('id is required')
      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .eq('id', id)
        .eq('company_id', companyId)
        .maybeSingle()
      if (error) throw error
      if (!data) throw new TrainingError('Training not found', 404)
      return data
    }

    const loadCaregiver = async (id: unknown) => {
      if (typeof id !== 'string' || !id) throw new TrainingError('caregiverId is required')
      const { data, error } = await supabase
        .from('caregivers')
        .select('id, name, company_id, role')
        .eq('id', id)
        .eq('company_id', companyId)
        .maybeSingle()
      if (error) throw error
      if (!data) throw new TrainingError('Employee not found', 404)
      return data
    }

    const logAudit = async (action: string, caregiver: { id: string; name: string }, metadata: Record<string, unknown>) => {
      if (ctx.isPlatformAdmin) return
      const { error } = await supabase.from('audit_logs').insert({
        admin_id: ctx.userId,
        admin_email: ctx.email,
        action,
        caregiver_id: caregiver.id,
        caregiver_name: caregiver.name,
        company_id: companyId,
        metadata,
      })
      if (error) console.error('audit log failed', error)
    }

    switch (action) {
      case 'list': {
        const { data: trainings, error } = await supabase
          .from('trainings')
          .select('*')
          .eq('company_id', companyId)
          .order('training_order', { ascending: true })
        if (error) throw error

        const ids = (trainings || []).map((t) => t.id)
        const [slides, questions] = ids.length
          ? await Promise.all([
              supabase.from('training_slides').select('training_id').in('training_id', ids),
              supabase.from('training_questions').select('training_id').in('training_id', ids),
            ])
          : [{ data: [] }, { data: [] }]

        const count = (rows: any[] | null, id: string) => (rows || []).filter((r) => r.training_id === id).length
        return trainingJson(
          (trainings || []).map((t) => ({
            ...t,
            slide_count: count(slides.data, t.id),
            question_count: count(questions.data, t.id),
          }))
        )
      }

      case 'get': {
        const training = await loadTraining(body.id)
        const [{ data: slides, error: slidesError }, { data: questions, error: questionsError }] = await Promise.all([
          supabase
            .from('training_slides')
            .select('id, slide_order, title, body, image_path, video_url')
            .eq('training_id', training.id)
            .order('slide_order', { ascending: true }),
          supabase
            .from('training_questions')
            .select('id, question_order, question_text, options, correct_answer_index')
            .eq('training_id', training.id)
            .order('question_order', { ascending: true }),
        ])
        if (slidesError) throw slidesError
        if (questionsError) throw questionsError
        return trainingJson({ training, slides: slides || [], questions: questions || [] })
      }

      case 'save': {
        const { fields, slides, questions } = validateTraining(body.training)
        let trainingId: string

        if (body.training.id) {
          const existing = await loadTraining(body.training.id)
          trainingId = existing.id
          const { error } = await supabase
            .from('trainings')
            .update({ ...fields, updated_at: new Date().toISOString() })
            .eq('id', trainingId)
          if (error) throw error
        } else {
          const { data: last } = await supabase
            .from('trainings')
            .select('training_order')
            .eq('company_id', companyId)
            .order('training_order', { ascending: false })
            .limit(1)
          const { data: created, error } = await supabase
            .from('trainings')
            .insert({ ...fields, company_id: companyId, training_order: (last?.[0]?.training_order || 0) + 10 })
            .select('id')
            .single()
          if (error) throw error
          trainingId = created.id
        }

        const { error: deleteSlidesError } = await supabase.from('training_slides').delete().eq('training_id', trainingId)
        if (deleteSlidesError) throw deleteSlidesError
        const { error: deleteQuestionsError } = await supabase.from('training_questions').delete().eq('training_id', trainingId)
        if (deleteQuestionsError) throw deleteQuestionsError

        if (slides.length) {
          const { error } = await supabase
            .from('training_slides')
            .insert(slides.map((s, i) => ({ ...s, training_id: trainingId, slide_order: (i + 1) * 10 })))
          if (error) throw error
        }
        if (questions.length) {
          const { error } = await supabase
            .from('training_questions')
            .insert(questions.map((q, i) => ({ ...q, training_id: trainingId, question_order: (i + 1) * 10 })))
          if (error) throw error
        }

        return trainingJson({ id: trainingId })
      }

      case 'delete': {
        const training = await loadTraining(body.id)
        const { error } = await supabase.from('trainings').delete().eq('id', training.id)
        if (error) throw error
        return trainingJson({ success: true })
      }

      case 'reorder': {
        const training = await loadTraining(body.id)
        if (body.direction !== 'up' && body.direction !== 'down') throw new TrainingError('direction must be "up" or "down"')

        const { data: all, error } = await supabase
          .from('trainings')
          .select('id, training_order')
          .eq('company_id', companyId)
          .order('training_order', { ascending: true })
        if (error) throw error

        const index = (all || []).findIndex((t) => t.id === training.id)
        const neighbor = (all || [])[body.direction === 'up' ? index - 1 : index + 1]
        if (!neighbor) throw new TrainingError(`Already at the ${body.direction === 'up' ? 'top' : 'bottom'}`)

        const current = all![index]
        const swapOrders = current.training_order === neighbor.training_order
          ? [current.training_order + (body.direction === 'up' ? -1 : 1), current.training_order]
          : [neighbor.training_order, current.training_order]

        const [{ error: e1 }, { error: e2 }] = await Promise.all([
          supabase.from('trainings').update({ training_order: swapOrders[0] }).eq('id', current.id),
          supabase.from('trainings').update({ training_order: swapOrders[1] }).eq('id', neighbor.id),
        ])
        if (e1) throw e1
        if (e2) throw e2
        return trainingJson({ success: true })
      }

      case 'upload-image': {
        const { fileBase64, contentType } = body
        const ext = IMAGE_EXTENSIONS[contentType]
        if (!fileBase64 || !ext) throw new TrainingError('Upload a PNG, JPG, WebP or GIF image')

        const payload = String(fileBase64).includes(',') ? String(fileBase64).split(',')[1] : String(fileBase64)
        const bytes = decodeBase64(payload)
        if (bytes.length > MAX_IMAGE_BYTES) throw new TrainingError('Images must be 5 MB or smaller')

        const path = `training/${companyId}/${crypto.randomUUID()}.${ext}`
        const { error } = await supabase.storage.from('company_assets').upload(path, bytes, { contentType })
        if (error) throw error
        return trainingJson({ image_path: path })
      }

      case 'caregiver-status': {
        const caregiver = await loadCaregiver(body.caregiverId)
        await assignTrainings(supabase, caregiver)

        const { data: rows, error } = await supabase
          .from('caregiver_trainings')
          .select('*, trainings(title, passing_score, training_order)')
          .eq('caregiver_id', caregiver.id)
        if (error) throw error

        const result = (rows || [])
          .map((r: any) => ({
            id: r.id,
            training_id: r.training_id,
            title: r.trainings?.title || 'Training',
            training_order: r.trainings?.training_order || 0,
            status: r.status,
            due_date: r.due_date,
            completed_at: r.completed_at,
            attempts: r.attempts,
            last_score: r.last_score,
            last_total: r.last_total,
            marked_by_admin: r.marked_by_admin,
            marked_by_name: r.marked_by_name,
          }))
          .sort((a, b) => a.training_order - b.training_order)
        return trainingJson(result)
      }

      case 'mark-complete': {
        const caregiver = await loadCaregiver(body.caregiverId)
        const training = await loadTraining(body.trainingId)
        const now = new Date().toISOString()

        const { data: existing } = await supabase
          .from('caregiver_trainings')
          .select('id')
          .eq('caregiver_id', caregiver.id)
          .eq('training_id', training.id)
          .maybeSingle()

        const completion = {
          status: 'passed',
          completed_at: now,
          marked_by_admin: true,
          marked_by: ctx.userId,
          marked_by_name: ctx.name,
        }

        if (existing) {
          const { error } = await supabase.from('caregiver_trainings').update(completion).eq('id', existing.id)
          if (error) throw error
        } else {
          const { error } = await supabase.from('caregiver_trainings').insert({
            ...completion,
            caregiver_id: caregiver.id,
            training_id: training.id,
            company_id: companyId,
            assigned_at: now,
          })
          if (error) throw error
        }

        await logAudit('marked_training_complete', caregiver, { training: training.title })
        return trainingJson({ success: true })
      }

      case 'reset': {
        const caregiver = await loadCaregiver(body.caregiverId)
        const training = await loadTraining(body.trainingId)

        const { error } = await supabase
          .from('caregiver_trainings')
          .update({
            status: 'not_started',
            current_slide: 0,
            attempts: 0,
            last_score: null,
            last_total: null,
            completed_at: null,
            marked_by_admin: false,
            marked_by: null,
            marked_by_name: null,
          })
          .eq('caregiver_id', caregiver.id)
          .eq('training_id', training.id)
        if (error) throw error

        await logAudit('reset_training', caregiver, { training: training.title })
        return trainingJson({ success: true })
      }

      default:
        throw new TrainingError('Unknown action')
    }
  } catch (err) {
    return trainingErrorResponse(err)
  }
})
