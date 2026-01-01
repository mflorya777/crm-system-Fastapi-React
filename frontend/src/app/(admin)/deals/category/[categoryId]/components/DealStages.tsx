import { Button, Card, CardBody } from 'react-bootstrap'
import clsx from 'clsx'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import type { DealCategory } from '@/hooks/useDealCategories'

interface DealStagesProps {
  category: DealCategory
  dealsByStage: Record<string, number>
  onAddStageClick?: () => void
}

const DealStages = ({ category, dealsByStage, onAddStageClick }: DealStagesProps) => {
  // Сортируем стадии по порядку
  const sortedStages = [...category.stages].sort((a, b) => a.order - b.order)

  return (
    <div className="mb-4">
      <div className="d-flex gap-3 overflow-x-auto pb-2" style={{ maxHeight: '70px' }}>
        {sortedStages.map((stage) => {
          const dealCount = dealsByStage[stage.id] || 0
          const stageColor = stage.color || '#6c757d'

          return (
            <Card
              key={stage.id}
              className={clsx('flex-shrink-0')}
              style={{
                width: '200px',
                minWidth: '200px',
                borderTop: `2px solid ${stageColor}`,
                borderBottom: `2px solid ${stageColor}`,
              }}>
              <CardBody className="py-2 px-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-semibold">{stage.name}</h6>
                  <span className="badge bg-light text-dark">{dealCount}</span>
                </div>
              </CardBody>
            </Card>
          )
        })}
        {/* Кнопка добавления стадии справа */}
        <Card
          className={clsx('flex-shrink-0')}
          style={{
            width: '200px',
            minWidth: '200px',
            border: '2px dashed #dee2e6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <CardBody className="py-1 px-3 text-center" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Button
              variant="light"
              className="w-100 h-100 d-flex align-items-center justify-content-center gap-2"
              style={{ border: 'none', padding: '0' }}
              onClick={onAddStageClick}>
              <IconifyIcon icon="bx:plus" className="fs-18" />
              <span className="small" style={{ fontSize: '0.75rem' }}>Добавить стадию</span>
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default DealStages

