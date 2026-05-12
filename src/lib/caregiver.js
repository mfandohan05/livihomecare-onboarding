import { supabase } from './supabase'

export async function getCaregiverByToken(token) {
  const { data, error } = await supabase
    .from('caregivers')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (error) return null
  return data
}

export async function updateCaregiverStatus(caregiverId, status) {
  const { error } = await supabase
    .from('caregivers')
    .update({ status })
    .eq('id', caregiverId)

  if (error) console.error('Error updating status:', error)
}

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

export async function loadProgress(caregiverId) {
  const { data, error } = await supabase
    .from('caregiver_progress')
    .select('*')
    .eq('caregiver_id', caregiverId)
    .maybeSingle()

  if (error) return null
  return data
}

export async function uploadDocument(caregiverId, caregiverName, documentType, file) {
  const fileExt = file.name.split('.').pop()
  const sanitizedName = caregiverName.replace(/[^a-zA-Z0-9]/g, '_')
  const filePath = `${caregiverId}/${sanitizedName}_${documentType}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, { upsert: true })

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    return null
  }

  const { error: dbError } = await supabase
    .from('caregiver_documents')
    .upsert({
      caregiver_id: caregiverId,
      document_type: documentType,
      file_name: `${sanitizedName}_${documentType}.${fileExt}`,
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

export async function getDocuments(caregiverId) {
  const { data, error } = await supabase
    .from('caregiver_documents')
    .select('*')
    .eq('caregiver_id', caregiverId)

  if (error) return []
  return data
}

export async function saveTaxFormData(caregiverId, formType, data) {
  const updates = { caregiver_id: caregiverId }
  
  if (formType === 'i9') {
    updates.i9_data = {
      lastName: data.lastName,
      firstName: data.firstName,
      middleInitial: data.middleInitial,
      otherLastNames: data.otherLastNames,
      address: data.address,
      apt: data.apt,
      city: data.city,
      state: data.state,
      zip: data.zip,
      email: data.email,
      phone: data.phone,
      citizenshipStatus: data.citizenshipStatus,
      uscisNumber: data.uscisNumber,
      expDate: data.expDate,
      alienNumber: data.alienNumber,
    }
  }

  if (formType === 'w4') {
    updates.w4_data = {
      firstName: data.firstName,
      lastName: data.lastName,
      address: data.address,
      cityStateZip: data.cityStateZip,
      filingStatus: data.filingStatus,
      multipleJobs: data.multipleJobs,
      childCredit: data.childCredit,
      otherDependents: data.otherDependents,
      totalCredits: data.totalCredits,
      otherIncome: data.otherIncome,
      deductions: data.deductions,
      extraWithholding: data.extraWithholding,
      exempt: data.exempt,
    }
  }

  if (formType === 'w9') {
    updates.w9_data = {
      name: data.name,
      businessName: data.businessName,
      taxClassification: data.taxClassification,
      llcClassification: data.llcClassification,
      otherDescription: data.otherDescription,
      address: data.address,
      cityStateZip: data.cityStateZip,
    }
  }

  const { error } = await supabase
    .from('caregiver_tax_forms')
    .upsert(updates, { onConflict: 'caregiver_id' })

  if (error) console.error('Error saving tax form data:', error)
}

export async function saveTimeLog(caregiverId, hoursWorked) {
  const { error } = await supabase
    .from('caregiver_time_logs')
    .insert({
      caregiver_id: caregiverId,
      session_start: new Date(Date.now() - hoursWorked * 60 * 60 * 1000).toISOString(),
      session_end: new Date().toISOString(),
      active_seconds: Math.round(hoursWorked * 3600),
      completed: true
    })

  if (error) console.error('Error saving time log:', error)
}