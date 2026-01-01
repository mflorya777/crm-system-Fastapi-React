import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card, CardBody, Col, Row } from 'react-bootstrap'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import { useDealCategory } from '@/hooks/useDealCategory'
import { useDealsByCategory } from '@/hooks/useDealsByCategory'
import { useMoveDealToStage } from '@/hooks/useMoveDealToStage'
import type { Deal } from '@/hooks/useDealsByCategory'
import AddDealModal from './components/AddDealModal'
import AddDealStageModal from './components/AddDealStageModal'
import EditDealModal from './components/EditDealModal'
import EditDealStageModal from './components/EditDealStageModal'

const DealCategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const { category, loading: categoryLoading, error: categoryError, refetch: refetchCategory } = useDealCategory(categoryId)
  const { deals, loading: dealsLoading, refetch: refetchDeals } = useDealsByCategory(categoryId, true)
  const [showAddStageModal, setShowAddStageModal] = useState(false)
  const [showAddDealModal, setShowAddDealModal] = useState(false)
  const [showEditDealModal, setShowEditDealModal] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [showEditStageModal, setShowEditStageModal] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const { moveDealToStage } = useMoveDealToStage(() => {
    refetchDeals()
  })

  const handleStageAdded = async () => {
    await refetchCategory()
    await refetchDeals()
  }

  const handleStageUpdated = async () => {
    await refetchCategory()
    await refetchDeals()
  }

  const handleStageClick = (stageId: string) => {
    setSelectedStageId(stageId)
    setShowEditStageModal(true)
  }

  const handleDealCreated = () => {
    refetchDeals()
  }

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal)
    setShowEditDealModal(true)
  }

  const handleDealUpdated = () => {
    refetchDeals()
  }

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setIsDragging(true)
    setDraggedDealId(dealId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', dealId)
    // Делаем карточку полупрозрачной при перетаскивании
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false)
    setDraggedDealId(null)
    setDragOverStageId(null)
    // Возвращаем непрозрачность
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStageId(stageId)
  }

  const handleDragLeave = () => {
    setDragOverStageId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault()
    setDragOverStageId(null)
    
    const dealId = e.dataTransfer.getData('text/plain')
    if (!dealId || !draggedDealId) return

    // Проверяем, что сделка не перемещается в ту же стадию
    const deal = deals.find((d) => d.id === dealId)
    if (deal && deal.stage_id === targetStageId) {
      return
    }

    try {
      await moveDealToStage(dealId, targetStageId)
    } catch (error) {
      console.error('Failed to move deal:', error)
    }
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
      <Card 
        className="mb-2" 
        style={{ cursor: 'grab' }}
        draggable
        onDragStart={(e) => handleDragStart(e, deal.id)}
        onDragEnd={handleDragEnd}
        onClick={() => {
          // Предотвращаем открытие модального окна при перетаскивании
          if (!isDragging) {
            handleDealClick(deal)
          }
        }}
      >
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
              {/* Колонки со сделками под стадиями */}
              <div className="overflow-x-auto pb-2">
                <div className="d-flex gap-3" style={{ flexWrap: 'nowrap' }}>
                  {sortedStages.map((stage) => {
                    const stageDeals = dealsByStageMap[stage.id] || []
                    const isFirstStage = stage.order === sortedStages[0]?.order
                    const stageColor = stage.color || '#6c757d'

                    return (
                      <div 
                        key={stage.id} 
                        style={{ minWidth: '280px', flexShrink: 0 }}
                        onDragOver={(e) => handleDragOver(e, stage.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, stage.id)}
                      >
                        <div className="h-100">
                          <div
                            className="d-flex justify-content-between align-items-center mb-2 py-2"
                            style={{
                              borderTop: `2px solid ${stageColor}`,
                              borderBottom: `2px solid ${stageColor}`,
                              borderRadius: '0.3rem',
                              boxShadow: '0px 3px 4px 0px rgba(0, 0, 0, 0.03)',
                              paddingLeft: '1.25rem',
                              paddingRight: '1.25rem',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleStageClick(stage.id)}>
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
                          <div 
                            className="d-flex flex-column" 
                            style={{ 
                              minHeight: '100px',
                              backgroundColor: dragOverStageId === stage.id ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                              borderRadius: '0.25rem',
                              padding: dragOverStageId === stage.id ? '0.5rem' : '0',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {stageDeals.length > 0 ? (
                              stageDeals.map((deal) => (
                                <DealCard key={deal.id} deal={deal} />
                              ))
                            ) : (
                              <div className="text-center py-3 text-muted small">
                                {dragOverStageId === stage.id ? (
                                  <div className="py-3">
                                    <IconifyIcon icon="bx:move" className="fs-24 mb-2" />
                                    <div>Отпустите для перемещения</div>
                                  </div>
                                ) : (
                                  <>
                                    <IconifyIcon icon="bx:inbox" className="fs-24 mb-2" />
                                    <div>Нет сделок</div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {/* Кнопка добавления стадии справа */}
                  <div style={{ minWidth: '280px', flexShrink: 0 }}>
                    <div className="h-100">
                      <div
                        className="d-flex justify-content-center align-items-center mb-2 py-2"
                        style={{
                          border: '2px dashed #dee2e6',
                          borderRadius: '0.3rem',
                          boxShadow: '0px 3px 4px 0px rgba(0, 0, 0, 0.03)',
                          paddingLeft: '1.25rem',
                          paddingRight: '1.25rem',
                          minHeight: '43px',
                        }}>
                        <Button
                          variant="light"
                          size="sm"
                          onClick={() => setShowAddStageModal(true)}
                          className="d-flex align-items-center justify-content-center gap-2"
                          style={{ border: 'none', padding: '0', background: 'transparent' }}>
                          <IconifyIcon icon="bx:plus" className="fs-18" />
                          <span className="small">Добавить стадию</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
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
          {selectedDeal && (
            <EditDealModal
              show={showEditDealModal}
              onHide={() => {
                setShowEditDealModal(false)
                setSelectedDeal(null)
              }}
              deal={selectedDeal}
              onDealUpdated={handleDealUpdated}
            />
          )}
          {selectedStageId && categoryId && category && (
            <EditDealStageModal
              show={showEditStageModal}
              onHide={() => {
                setShowEditStageModal(false)
                setSelectedStageId(null)
              }}
              categoryId={categoryId}
              currentStages={category.stages}
              stageId={selectedStageId}
              onStageUpdated={handleStageUpdated}
            />
          )}
        </>
      )}
    </>
  )
}

export default DealCategoryPage

