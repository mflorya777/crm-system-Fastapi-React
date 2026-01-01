import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card, CardBody, Col, Row } from 'react-bootstrap'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import { useDealCategory } from '@/hooks/useDealCategory'
import { useDealsByCategory } from '@/hooks/useDealsByCategory'
import type { Deal } from '@/hooks/useDealsByCategory'
import AddDealModal from './components/AddDealModal'
import AddDealStageModal from './components/AddDealStageModal'
import DealStages from './components/DealStages'

const DealCategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const { category, loading: categoryLoading, error: categoryError, refetch: refetchCategory } = useDealCategory(categoryId)
  const { deals, loading: dealsLoading, refetch: refetchDeals } = useDealsByCategory(categoryId, true)
  const [showAddStageModal, setShowAddStageModal] = useState(false)
  const [showAddDealModal, setShowAddDealModal] = useState(false)

  const handleStageAdded = () => {
    refetchCategory()
  }

  const handleDealCreated = () => {
    refetchDeals()
  }

  if (categoryLoading || dealsLoading) {
    return (
      <>
        <PageBreadcrumb subName="Сделки" title="Загрузка..." />
        <PageMetaData title="Загрузка..." />
        <Card>
          <CardBody className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
          </CardBody>
        </Card>
      </>
    )
  }

  if (categoryError || !category) {
    return (
      <>
        <PageBreadcrumb subName="Сделки" title="Ошибка" />
        <PageMetaData title="Ошибка" />
        <Card>
          <CardBody className="text-center py-5">
            <h5 className="text-danger">Ошибка загрузки категории</h5>
            <p className="text-muted">{categoryError || 'Категория не найдена'}</p>
          </CardBody>
        </Card>
      </>
    )
  }

  // Группируем сделки по стадиям для отображения количества
  const dealsByStage: Record<string, number> = {}
  deals.forEach((deal) => {
    dealsByStage[deal.stage_id] = (dealsByStage[deal.stage_id] || 0) + 1
  })

  // Группируем сделки по стадиям
  const dealsByStageMap: Record<string, Deal[]> = {}
  deals.forEach((deal) => {
    if (!dealsByStageMap[deal.stage_id]) {
      dealsByStageMap[deal.stage_id] = []
    }
    dealsByStageMap[deal.stage_id].push(deal)
  })

  // Сортируем стадии по порядку
  const sortedStages = category.stages ? [...category.stages].sort((a, b) => a.order - b.order) : []

  // Компонент карточки сделки
  const DealCard = ({ deal }: { deal: Deal }) => {
    return (
      <Card className="mb-2">
        <CardBody className="p-3">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h6 className="mb-0 fw-semibold">{deal.title}</h6>
          </div>
          {deal.description && <p className="text-muted small mb-2">{deal.description}</p>}
          <div className="d-flex flex-wrap gap-2 mb-2">
            {deal.amount && (
              <div className="d-flex align-items-center gap-1">
                <IconifyIcon icon="bx:dollar" className="fs-14" />
                <span className="small fw-semibold">
                  {deal.amount.toLocaleString('ru-RU')} {deal.currency || 'RUB'}
                </span>
              </div>
            )}
            <div className="d-flex align-items-center gap-1 text-muted">
              <IconifyIcon icon="bx:calendar" className="fs-14" />
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
    )
  }

  return (
    <>
      <PageBreadcrumb subName="Сделки" title={category.name} />
      <PageMetaData title={category.name} />

      <Row>
        <Col xs={12}>
          {/* Стадии и сделки в одной обертке */}
          <Card>
            <CardBody>
              <h5 className="mb-3">Воронка продаж</h5>
              {/* Стадии (воронка) */}
              <DealStages
                category={category}
                dealsByStage={dealsByStage}
                onAddStageClick={() => setShowAddStageModal(true)}
              />

              {/* Колонки со сделками под стадиями */}
              <div className="mt-4">
                <Row className="g-3">
                  {sortedStages.map((stage) => {
                    const stageDeals = dealsByStageMap[stage.id] || []
                    const isFirstStage = stage.order === sortedStages[0]?.order
                    const stageColor = stage.color || '#6c757d'

                    return (
                      <Col key={stage.id} xs={12} md={6} lg={4} xl={3}>
                        <div className="h-100">
                          <div
                            className="d-flex justify-content-between align-items-center mb-2 py-2"
                            style={{
                              borderTop: `2px solid ${stageColor}`,
                              borderBottom: `2px solid ${stageColor}`,
                              borderRadius: '0.3rem',
                              boxShadow: '0px 3px 4px 0px rgba(0, 0, 0, 0.03)',
                            }}>
                            <h6 className="mb-0 fw-semibold">{stage.name}</h6>
                            <span className="badge bg-light text-dark">{stageDeals.length}</span>
                          </div>
                          {/* Кнопка добавления сделки только для первой стадии */}
                          {isFirstStage && (
                            <div className="mb-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setShowAddDealModal(true)}
                                className="w-100 d-flex align-items-center justify-content-center gap-2">
                                <IconifyIcon icon="bx:plus" />
                                Добавить сделку
                              </Button>
                            </div>
                          )}
                          {/* Список сделок для этой стадии */}
                          <div className="d-flex flex-column" style={{ minHeight: '100px' }}>
                            {stageDeals.length > 0 ? (
                              stageDeals.map((deal) => (
                                <DealCard key={deal.id} deal={deal} />
                              ))
                            ) : (
                              <div className="text-center py-3 text-muted small">
                                <IconifyIcon icon="bx:inbox" className="fs-24 mb-2" />
                                <div>Нет сделок</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                    )
                  })}
                </Row>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Модальные окна */}
      {categoryId && (
        <>
          <AddDealStageModal
            show={showAddStageModal}
            onHide={() => setShowAddStageModal(false)}
            categoryId={categoryId}
            currentStages={category?.stages || []}
            onStageAdded={handleStageAdded}
          />
          {categoryId && category && (
            <AddDealModal
              show={showAddDealModal}
              onHide={() => setShowAddDealModal(false)}
              categoryId={categoryId}
              category={category}
              onDealCreated={handleDealCreated}
            />
          )}
        </>
      )}
    </>
  )
}

export default DealCategoryPage

