export const job_label = (db_label, roleOptions) => {
    const match = roleOptions.find(r => r.role_key === db_label)
    return match?.display_label || db_label
}