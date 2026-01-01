import { Card, CardBody, Col, Row } from 'react-bootstrap'
import clsx from 'clsx'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import type { Deal } from '@/hooks/useDealsByCategory'
import type { DealCategory } from '@/hooks/useDealCategories'

interface DealsListProps {
  deals: Deal[]
  category: DealCategory
}

const DealCard = ({ deal, category }: { deal: Deal; category: DealCategory }) => {
  const stage = category.stages.find((s) => s.id === deal.stage_id)
  const stageColor = stage?.color || '#6c757d'

  return (
    <Col md={6} lg={4} className="mb-3">
      <Card className="h-100">
        <CardBody>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h5 className="mb-0">{deal.title}</h5>
            <span
              className="badge"
              style={{
                backgroundColor: stageColor,
                color: 'white',
              }}>
              {stage?.name || 'Без стадии'}
            </span>
          </div>
          {deal.description && <p className="text-muted small mb-2">{deal.description}</p>}
          <div className="d-flex flex-wrap gap-2 mb-2">
            {deal.amount && (
              <div className="d-flex align-items-center gap-1">
                <IconifyIcon icon="bx:dollar" className="fs-16" />
                <span className="small fw-semibold">
                  {deal.amount.toLocaleString('ru-RU')} {deal.currency || 'RUB'}
                </span>
              </div>
            )}
            <div className="d-flex align-items-center gap-1 text-muted">
              <IconifyIcon icon="bx:calendar" className="fs-16" />
              <span className="small">
                {new Date(deal.created_at).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
          {!deal.is_active && (
            <div className="mt-2">
              <span className="badge bg-secondary">Закрыта</span>
            </div>
          )}
        </CardBody>
      </Card>
    </Col>
  )
}

const DealsList = ({ deals, category }: DealsListProps) => {
  if (deals.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-5">
          <IconifyIcon icon="bx:inbox" className="fs-48 text-muted mb-3" />
          <h5 className="text-muted">Нет сделок</h5>
          <p className="text-muted mb-0">В этой категории пока нет сделок</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Row>
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} category={category} />
      ))}
    </Row>
  )
}

export default DealsList

