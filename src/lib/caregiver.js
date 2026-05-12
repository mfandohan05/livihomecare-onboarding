import { supabase } from './supabase'

// Get caregiver by token — replaces getCaregiverByToken from mock data
export async function getCaregiverByToken(token) {
  const { data, error } = await supabase
    .from('caregivers')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (error) return null
  return data
}

// Update caregiver status
export async function updateCaregiverStatus(caregiverId, status) {
  const { error } = await supabase
    .from('caregivers')
    .update({ status })
    .eq('id', caregiverId)

  if (error) console.error('Error updating status:', error)
}

// Save progress
export async function saveProgress(caregiverId, activeStep, completedSteps, formData) {
  const { error } = await supabase
    .from('caregiver_progress')
    .upsert({
      caregiver_id: caregiverId,
      active_step: activeStep,
      completed_steps: completedSteps,
      form_data: formData,
      last_saved: new Date().toISOString()
    }, {
      onConflict: 'caregiver_id'
    })

  if (error) console.error('Error saving progress:', error)
}

// Load progress
export async function loadProgress(caregiverId) {
  const { data, error } = await supabase
    .from('caregiver_progress')
    .select('*')
    .eq('caregiver_id', caregiverId)
    .maybeSingle()

  if (error) return null
  return data
}

export async function uploadDocument(caregiverId, documentType, file) {
  const fileExt = file.name.split('.').pop()
  const filePath = `${caregiverId}/${documentType}.${fileExt}`

  // upload to storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    return null
  }

  // save record to DB
  const { error: dbError } = await supabase
    .from('caregiver_documents')
    .upsert({
      caregiver_id: caregiverId,
      document_type: documentType,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
    }, {
      onConflict: 'caregiver_id, document_type'
    })

  if (dbError) {
    console.error('Error saving document record:', dbError)
    return null
  }

  return filePath
}