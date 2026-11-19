import { requireAdmin } from '../../utils/auth'
import { listAudit } from '../../utils/adminStore'

export default defineEventHandler((event) => {
  requireAdmin(event)
  const query = getQuery(event)
  const page = Math.max(1, Number(String(query.page ?? '')) || 1)
  const pageSize = Math.min(100, Math.max(5, Number(String(query.pageSize ?? '')) || 20))
  return listAudit(pageSize, (page - 1) * pageSize)
})
