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
  const [dragOverPosition, setDragOverPosition] = useState<{ stageId: string; index: number } | null>(null)
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
    setDragOverPosition(null)
    // Возвращаем непрозрачность
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  // Группируем сделки по стадиям и сортируем по order (выносим выше, чтобы использовать в обработчиках)
  const dealsByStageMap: Record<string, Deal[]> = {}
  deals.forEach((deal) => {
    if (!dealsByStageMap[deal.stage_id]) {
      dealsByStageMap[deal.stage_id] = []
    }
    dealsByStageMap[deal.stage_id].push(deal)
  })
  
  // Сортируем сделки по order в каждой стадии
  Object.keys(dealsByStageMap).forEach((stageId) => {
    dealsByStageMap[stageId].sort((a, b) => a.order - b.order)
  })

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStageId(stageId)
    
    // Вычисляем позицию вставки на основе координат курсора
    const stageDeals = dealsByStageMap[stageId] || []
    const container = e.currentTarget as HTMLElement
    const rect = container.getBoundingClientRect()
    const y = e.clientY - rect.top
    
    // Находим индекс вставки на основе позиции курсора
    let insertIndex = stageDeals.length
    
    // Проверяем, над какой карточкой находится курсор
    const dealElements = container.querySelectorAll('[data-deal-id]')
    dealElements.forEach((element, index) => {
      const elementRect = element.getBoundingClientRect()
      const elementTop = elementRect.top - rect.top
      const elementBottom = elementRect.bottom - rect.top
      
      if (y >= elementTop && y <= elementBottom) {
        // Курсор находится над карточкой
        const elementCenter = (elementTop + elementBottom) / 2
        insertIndex = y < elementCenter ? index : index + 1
      } else if (y < elementTop && index === 0) {
        // Курсор выше первой карточки
        insertIndex = 0
      }
    })
    
    setDragOverPosition({ stageId, index: insertIndex })
  }

  const handleCardDragOver = (e: React.DragEvent, stageId: string, dealIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    
    // Определяем, в какую половину карточки попадает курсор
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height
    
    // Если курсор в верхней половине - вставляем перед карточкой, иначе - после
    const insertIndex = y < height / 2 ? dealIndex : dealIndex + 1
    
    setDragOverPosition({ stageId, index: insertIndex })
    setDragOverStageId(stageId)
  }

  const handleEmptyZoneDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    const stageDeals = dealsByStageMap[stageId] || []
    setDragOverPosition({ stageId, index: stageDeals.length })
    setDragOverStageId(stageId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Проверяем, что мы действительно покинули контейнер
    const currentTarget = e.currentTarget as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement
    
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverStageId(null)
      setDragOverPosition(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverStageId(null)
    
    const dealId = e.dataTransfer.getData('text/plain')
    if (!dealId || !draggedDealId) return

    const deal = deals.find((d) => d.id === dealId)
    if (!deal) return

    // Определяем позицию вставки
    const stageDeals = dealsByStageMap[targetStageId] || []
    let insertIndex = stageDeals.length
    
    if (dragOverPosition && dragOverPosition.stageId === targetStageId) {
      insertIndex = dragOverPosition.index
    } else {
      // Если позиция не определена, вычисляем на основе координат
      const container = e.currentTarget as HTMLElement
      const rect = container.getBoundingClientRect()
      const y = e.clientY - rect.top
      
      const dealElements = container.querySelectorAll('[data-deal-id]')
      dealElements.forEach((element, index) => {
        const elementRect = element.getBoundingClientRect()
        const elementTop = elementRect.top - rect.top
        const elementBottom = elementRect.bottom - rect.top
        
        if (y >= elementTop && y <= elementBottom) {
          const elementCenter = (elementTop + elementBottom) / 2
          insertIndex = y < elementCenter ? index : index + 1
        } else if (y < elementTop && index === 0) {
          insertIndex = 0
        }
      })
    }

    // Вычисляем order на основе позиции вставки
    let order: number
    if (insertIndex === 0) {
      // Вставляем в начало
      if (stageDeals.length === 0) {
        order = 0
      } else {
        const firstDeal = stageDeals[0]
        // Если перемещаем в ту же стадию и это та же карточка, не меняем порядок
        if (deal.stage_id === targetStageId && deal.id === firstDeal.id) {
          setDragOverPosition(null)
          return
        }
        order = firstDeal.order - 1
      }
    } else if (insertIndex >= stageDeals.length) {
      // Вставляем в конец
      if (stageDeals.length === 0) {
        order = 0
      } else {
        const lastDeal = stageDeals[stageDeals.length - 1]
        // Если перемещаем в ту же стадию и это та же карточка, не меняем порядок
        if (deal.stage_id === targetStageId && deal.id === lastDeal.id) {
          setDragOverPosition(null)
          return
        }
        order = lastDeal.order + 1
      }
    } else {
      // Вставляем между карточками
      const prevDeal = stageDeals[insertIndex - 1]
      const nextDeal = stageDeals[insertIndex]
      
      // Если перемещаем в ту же стадию и позиция не изменилась, не делаем ничего
      if (deal.stage_id === targetStageId) {
        const currentIndex = stageDeals.findIndex((d) => d.id === dealId)
        if (currentIndex === insertIndex - 1 || currentIndex === insertIndex) {
          setDragOverPosition(null)
          return
        }
      }
      
      // Вычисляем средний order между предыдущей и следующей карточками
      const orderDiff = nextDeal.order - prevDeal.order
      if (orderDiff > 1) {
        // Есть место между порядками
        order = Math.floor((prevDeal.order + nextDeal.order) / 2)
      } else {
        // Порядки слишком близки, нужно пересчитать порядки всех карточек
        // Для простоты используем порядок следующей карточки
        order = nextDeal.order
      }
    }

    // Если перемещаем в ту же стадию, проверяем, изменилась ли позиция
    if (deal.stage_id === targetStageId) {
      const currentIndex = stageDeals.findIndex((d) => d.id === dealId)
      if (currentIndex === insertIndex || (currentIndex === insertIndex - 1 && insertIndex > 0)) {
        setDragOverPosition(null)
        return // Позиция не изменилась
      }
    }

    try {
      await moveDealToStage(dealId, targetStageId, order)
      setDragOverPosition(null)
    } catch (error) {
      console.error('Failed to move deal:', error)
      setDragOverPosition(null)
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

  // Сортируем стадии по порядку
  const sortedStages = category.stages ? [...category.stages].sort((a, b) => a.order - b.order) : []

  // Компонент карточки сделки
  const DealCard = ({ deal, index }: { deal: Deal; index: number }) => {
    const stageId = deal.stage_id
    const showInsertIndicator = dragOverPosition?.stageId === stageId && dragOverPosition.index === index
    
    return (
      <>
        {/* Индикатор вставки перед карточкой */}
        {showInsertIndicator && (
          <div
            style={{
              height: '4px',
              backgroundColor: '#0d6efd',
              borderRadius: '2px',
              marginBottom: '0.5rem',
              transition: 'all 0.2s ease',
            }}
          />
        )}
        <Card 
          className="mb-2" 
          style={{ cursor: 'grab' }}
          draggable
          data-deal-id={deal.id}
          onDragStart={(e) => handleDragStart(e, deal.id)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleCardDragOver(e, stageId, index)}
          onDragLeave={handleDragLeave}
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
      </>
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
                              backgroundColor: dragOverStageId === stage.id ? 'rgba(0, 123, 255, 0.05)' : 'transparent',
                              borderRadius: '0.25rem',
                              padding: dragOverStageId === stage.id ? '0.5rem' : '0',
                              transition: 'all 0.2s ease',
                            }}
                            onDragOver={(e) => handleDragOver(e, stage.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, stage.id)}
                          >
                            {stageDeals.length > 0 ? (
                              <>
                                {/* Индикатор вставки в начало списка */}
                                {dragOverPosition?.stageId === stage.id && dragOverPosition.index === 0 && (
                                  <div
                                    style={{
                                      height: '4px',
                                      backgroundColor: '#0d6efd',
                                      borderRadius: '2px',
                                      marginBottom: '0.5rem',
                                      transition: 'all 0.2s ease',
                                    }}
                                  />
                                )}
                                {stageDeals.map((deal, index) => (
                                  <DealCard key={deal.id} deal={deal} index={index} />
                                ))}
                                {/* Индикатор вставки в конец списка */}
                                {dragOverPosition?.stageId === stage.id && dragOverPosition.index === stageDeals.length && (
                                  <div
                                    style={{
                                      height: '4px',
                                      backgroundColor: '#0d6efd',
                                      borderRadius: '2px',
                                      marginTop: '0.5rem',
                                      transition: 'all 0.2s ease',
                                    }}
                                  />
                                )}
                              </>
                            ) : (
                              <div 
                                className="text-center py-3 text-muted small"
                                onDragOver={(e) => handleEmptyZoneDragOver(e, stage.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, stage.id)}
                              >
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

