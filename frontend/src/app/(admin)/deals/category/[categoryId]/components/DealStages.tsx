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
      <div className="d-flex gap-3 overflow-x-auto pb-2" style={{ minHeight: '120px' }}>
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
                borderTop: `4px solid ${stageColor}`,
              }}>
              <CardBody className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 fw-semibold">{stage.name}</h6>
                  <span className="badge bg-light text-dark">{dealCount}</span>
                </div>
                <div className="text-muted small">Стадия {stage.order}</div>
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
          <CardBody className="p-3 text-center">
            <Button
              variant="light"
              className="w-100 h-100 d-flex flex-column align-items-center justify-content-center"
              style={{ minHeight: '80px', border: 'none' }}
              onClick={onAddStageClick}>
              <IconifyIcon icon="bx:plus" className="fs-24 mb-2" />
              <span className="small">Добавить стадию</span>
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default DealStages

