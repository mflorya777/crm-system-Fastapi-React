import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card, CardBody, Col, Row, Form, InputGroup, Dropdown } from 'react-bootstrap'

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
  const [draggedCardHeight, setDraggedCardHeight] = useState<number>(80)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<{ stageId: string; index: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartedRef = useRef(false)
  const [viewMode, setViewMode] = useState<'columns' | 'list'>('columns')
  
  // Поиск, сортировка, фильтрация
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'created_at' | 'amount' | 'title'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filterStageId, setFilterStageId] = useState<string | null>(null)

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

  // Фильтрация и сортировка сделок
  const filteredAndSortedDeals = deals
    .filter((deal) => {
      // Поиск по названию
      if (searchQuery && !deal.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Фильтр по стадии
      if (filterStageId && deal.stage_id !== filterStageId) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortField === 'amount') {
        comparison = (a.amount || 0) - (b.amount || 0)
      } else if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title)
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

  const sortFieldLabels: Record<string, string> = {
    created_at: 'Дата создания',
    amount: 'Сумма',
    title: 'Название',
  }

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    dragStartedRef.current = true
    setIsDragging(true)
    setDraggedDealId(dealId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', dealId)
    if (e.currentTarget instanceof HTMLElement) {
      const rect = e.currentTarget.getBoundingClientRect()
      setDraggedCardHeight(rect.height || 80)
      e.currentTarget.style.opacity = '0.4'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false)
    setDraggedDealId(null)
    setDragOverStageId(null)
    setDragOverPosition(null)
    // сбрасываем флаг начала драга, чтобы клик после дропа не открывал модалку
    setTimeout(() => {
      dragStartedRef.current = false
    }, 0)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  // Группируем сделки по стадиям и сортируем по order (выносим выше, чтобы использовать в обработчиках)
  // Применяем поиск для фильтрации в режиме колонок
  const filteredDealsForColumns = deals.filter((deal) => {
    if (searchQuery && !deal.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })
  
  const dealsByStageMap: Record<string, Deal[]> = {}
  filteredDealsForColumns.forEach((deal) => {
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
    
    const stageDeals = dealsByStageMap[stageId] || []
    const container = e.currentTarget as HTMLElement
    const rect = container.getBoundingClientRect()
    const y = e.clientY - rect.top
    const threshold = Math.max(12, draggedCardHeight / 6) // слегка расширяем верх/низ зоны карточки
    
    // Находим все карточки в контейнере
    const dealElements = container.querySelectorAll('[data-deal-id]')
    let insertIndex = stageDeals.length
    
    if (dealElements.length === 0) {
      // Нет карточек, вставляем в начало
      insertIndex = 0
    } else {
      // Проверяем позицию курсора относительно карточек
      let foundPosition = false
      
      dealElements.forEach((element, idx) => {
        if (foundPosition) return
        
        const elementRect = element.getBoundingClientRect()
        const elementTop = elementRect.top - rect.top
        const elementBottom = elementRect.bottom - rect.top
        const elementCenter = (elementTop + elementBottom) / 2
        
        if (y >= elementTop - threshold && y <= elementBottom + threshold) {
          // Курсор в расширенной зоне карточки
          if (y <= elementTop + threshold) {
            insertIndex = idx
          } else if (y >= elementBottom - threshold) {
            insertIndex = idx + 1
          } else {
            insertIndex = y < elementCenter ? idx : idx + 1
          }
          foundPosition = true
        } else if (y < elementTop && idx === 0) {
          // Курсор выше первой карточки
          insertIndex = 0
          foundPosition = true
        } else if (idx === dealElements.length - 1 && y > elementBottom) {
          // Курсор ниже последней карточки
          insertIndex = stageDeals.length
          foundPosition = true
        }
      })
    }
    
    setDragOverPosition({ stageId, index: insertIndex })
  }

  const handleCardDragOver = (e: React.DragEvent, stageId: string, dealIndex: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const threshold = Math.max(12, draggedCardHeight / 6)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const elementTop = 0
    const elementBottom = rect.height
    const elementCenter = rect.height / 2

    let insertIndex = dealIndex
    if (y <= elementTop + threshold) {
      insertIndex = dealIndex
    } else if (y >= elementBottom - threshold) {
      insertIndex = dealIndex + 1
    } else {
      insertIndex = y < elementCenter ? dealIndex : dealIndex + 1
    }

    setDragOverStageId(stageId)
    setDragOverPosition({ stageId, index: insertIndex })
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
    
    const currentDragOverPosition = dragOverPosition
    
    const dealId = e.dataTransfer.getData('text/plain')
    if (!dealId || !draggedDealId) {
      return
    }

    const deal = deals.find((d) => d.id === dealId)
    if (!deal) {
      return
    }

    // Определяем позицию вставки
    const stageDeals = dealsByStageMap[targetStageId] || []
    let insertIndex = stageDeals.length
    
    // Используем сохраненную позицию из dragOverPosition
    if (currentDragOverPosition && currentDragOverPosition.stageId === targetStageId) {
      insertIndex = currentDragOverPosition.index
    } else {
      // Если позиция не определена, вычисляем на основе координат
      const container = e.currentTarget as HTMLElement
      const rect = container.getBoundingClientRect()
      const y = e.clientY - rect.top
      const threshold = Math.max(12, draggedCardHeight / 6)
      
      const dealElements = container.querySelectorAll('[data-deal-id]')
      if (dealElements.length === 0) {
        insertIndex = 0
      } else {
        let foundPosition = false
        dealElements.forEach((element, index) => {
          if (foundPosition) return
          
          const elementRect = element.getBoundingClientRect()
          const elementTop = elementRect.top - rect.top
          const elementBottom = elementRect.bottom - rect.top
          const elementCenter = (elementTop + elementBottom) / 2
          
          if (y >= elementTop - threshold && y <= elementBottom + threshold) {
            if (y <= elementTop + threshold) {
              insertIndex = index
            } else if (y >= elementBottom - threshold) {
              insertIndex = index + 1
            } else {
              insertIndex = y < elementCenter ? index : index + 1
            }
            foundPosition = true
          } else if (y < elementTop && index === 0) {
            insertIndex = 0
            foundPosition = true
          } else if (index === dealElements.length - 1 && y > elementBottom) {
            insertIndex = stageDeals.length
            foundPosition = true
          }
        })
      }
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
        return // Позиция не изменилась
      }
    }

    try {
      await moveDealToStage(dealId, targetStageId, order)
    } catch (error) {
      console.error('Failed to move deal:', error)
    } finally {
      setDragOverStageId(null)
      setDragOverPosition(null)
    }
  }

  // Показываем спиннер только при первой загрузке, когда данных еще нет
  if ((categoryLoading || dealsLoading) && !category) {
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

  const renderPlaceholder = (stageId: string, index: number) => {
    const isActive = dragOverPosition?.stageId === stageId && dragOverPosition.index === index
    if (!isActive) return null
    return (
      <div
        style={{
          height: `${draggedCardHeight}px`,
          margin: '0 0 8px 0',
          borderRadius: '0.35rem',
          border: '1px dashed #0d6efd',
          backgroundColor: 'rgba(13,110,253,0.06)',
          transition: 'all 0.1s ease',
        }}
      />
    )
  }

  // Компонент карточки сделки
  const DealCard = ({ deal }: { deal: Deal }) => {
    return (
      <Card 
        className="mb-2" 
        style={{ cursor: 'grab' }}
        draggable
        data-deal-id={deal.id}
        onDragStart={(e) => handleDragStart(e, deal.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => {
          if (!isDragging || !draggedDealId) return
          handleCardDragOver(e, deal.stage_id, (dealsByStageMap[deal.stage_id] || []).findIndex((d) => d.id === deal.id))
        }}
        onClick={() => {
          // Предотвращаем открытие модального окна при перетаскивании
          if (dragStartedRef.current || isDragging) {
            return
          }
          handleDealClick(deal)
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
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <h5 className="mb-0">Воронка продаж</h5>
                  <span className="text-muted small">
                    ({deals.length} {deals.length === 1 ? 'сделка' : deals.length >= 2 && deals.length <= 4 ? 'сделки' : 'сделок'}
                    {deals.length > 0 && `, ожидается ${deals.reduce((sum, deal) => sum + (deal.amount || 0), 0).toLocaleString('ru-RU')} ₽`})
                  </span>
                </div>
                <div className="d-flex gap-1">
                  <Button
                    variant={viewMode === 'columns' ? 'primary' : 'light'}
                    size="sm"
                    onClick={() => setViewMode('columns')}
                    title="Отображение колонками"
                    style={{ padding: '0.25rem 0.5rem' }}
                  >
                    <IconifyIcon icon="bx:columns" className="fs-18" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'primary' : 'light'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    title="Отображение списком"
                    style={{ padding: '0.25rem 0.5rem' }}
                  >
                    <IconifyIcon icon="bx:list-ul" className="fs-18" />
                  </Button>
                </div>
              </div>

              {/* Поиск, сортировка, фильтрация */}
              <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                {/* Поиск */}
                <InputGroup style={{ maxWidth: '300px' }}>
                  <InputGroup.Text className="bg-white">
                    <IconifyIcon icon="bx:search" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Поиск по названию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSearchQuery('')}
                      style={{ borderLeft: 'none' }}
                    >
                      <IconifyIcon icon="bx:x" />
                    </Button>
                  )}
                </InputGroup>

                {/* Сортировка */}
                <Dropdown>
                  <Dropdown.Toggle variant="light" size="sm" className="d-flex align-items-center gap-1">
                    <IconifyIcon icon="bx:sort-alt-2" className="fs-18" />
                    {sortFieldLabels[sortField]}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item 
                      active={sortField === 'created_at'} 
                      onClick={() => setSortField('created_at')}
                    >
                      Дата создания
                    </Dropdown.Item>
                    <Dropdown.Item 
                      active={sortField === 'amount'} 
                      onClick={() => setSortField('amount')}
                    >
                      Сумма
                    </Dropdown.Item>
                    <Dropdown.Item 
                      active={sortField === 'title'} 
                      onClick={() => setSortField('title')}
                    >
                      Название
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <Button
                  variant="light"
                  size="sm"
                  onClick={toggleSortDirection}
                  title={sortDirection === 'asc' ? 'По возрастанию' : 'По убыванию'}
                  className="d-flex align-items-center"
                >
                  <IconifyIcon 
                    icon={sortDirection === 'asc' ? 'bx:sort-up' : 'bx:sort-down'} 
                    className="fs-18" 
                  />
                </Button>

                {/* Фильтрация по стадии */}
                <Dropdown>
                  <Dropdown.Toggle 
                    variant={filterStageId ? 'primary' : 'light'} 
                    size="sm" 
                    className="d-flex align-items-center gap-1"
                  >
                    <IconifyIcon icon="bx:filter-alt" className="fs-18" />
                    {filterStageId 
                      ? sortedStages.find((s) => s.id === filterStageId)?.name || 'Стадия' 
                      : 'Все стадии'
                    }
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item 
                      active={filterStageId === null} 
                      onClick={() => setFilterStageId(null)}
                    >
                      Все стадии
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    {sortedStages.map((stage) => (
                      <Dropdown.Item
                        key={stage.id}
                        active={filterStageId === stage.id}
                        onClick={() => setFilterStageId(stage.id)}
                      >
                        <span 
                          className="d-inline-block rounded-circle me-2" 
                          style={{ 
                            width: '10px', 
                            height: '10px', 
                            backgroundColor: stage.color || '#6c757d' 
                          }} 
                        />
                        {stage.name}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>

                {/* Индикатор активных фильтров */}
                {(searchQuery || filterStageId) && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('')
                      setFilterStageId(null)
                    }}
                    className="d-flex align-items-center gap-1"
                  >
                    <IconifyIcon icon="bx:x" />
                    Сбросить фильтры
                  </Button>
                )}
              </div>
              
              {/* Отображение колонками */}
              {viewMode === 'columns' && (
              <div className="overflow-x-auto pb-2">
                <div className="d-flex gap-3" style={{ flexWrap: 'nowrap' }}>
                  {sortedStages.map((stage, idx) => {
                    const stageDeals = dealsByStageMap[stage.id] || []
                    const isFirstStage = stage.order === sortedStages[0]?.order
                    const stageColor = stage.color || '#6c757d'
                    const baseBg = idx % 2 === 0 ? 'transparent' : '#f7f8fa'
                    const hoverBg = 'rgba(0, 123, 255, 0.04)'

                    return (
                  <div 
                    key={stage.id} 
                    style={{ 
                      minWidth: '280px', 
                      flexShrink: 0,
                      backgroundColor: dragOverStageId === stage.id ? hoverBg : baseBg,
                      padding: '6px',
                      borderRadius: '0.35rem',
                      transition: 'all 0.15s ease',
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault()
                      setDragOverStageId(stage.id)
                      // Если ещё не выбрана позиция, ставим в конец по умолчанию
                      if (!dragOverPosition || dragOverPosition.stageId !== stage.id) {
                        setDragOverPosition({ stageId: stage.id, index: stageDeals.length })
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      handleDragOver(e, stage.id)
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDrop(e, stage.id)
                    }}
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
                              minHeight: '120px',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {stageDeals.length > 0 ? (
                              <>
                                {renderPlaceholder(stage.id, 0)}
                                {stageDeals.map((deal, index) => (
                                  <div key={deal.id}>
                                    <DealCard deal={deal} />
                                    {renderPlaceholder(stage.id, index + 1)}
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div 
                                className="text-center py-3 text-muted small"
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  setDragOverStageId(stage.id)
                                  setDragOverPosition({ stageId: stage.id, index: 0 })
                                }}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setDragOverStageId(stage.id)
                                  setDragOverPosition({ stageId: stage.id, index: 0 })
                                  handleDrop(e, stage.id)
                                }}
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
              )}
              
              {/* Отображение списком */}
              {viewMode === 'list' && (
                <div>
                  {/* Заголовок таблицы */}
                  <div 
                    className="d-flex align-items-center py-2 px-3 mb-2" 
                    style={{ 
                      backgroundColor: '#f7f8fa', 
                      borderRadius: '0.35rem',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    <div style={{ flex: 2 }}>Название</div>
                    <div style={{ flex: 1 }}>Стадия</div>
                    <div style={{ flex: 1 }}>Сумма</div>
                    <div style={{ flex: 1 }}>Дата создания</div>
                  </div>
                  
                  {/* Список сделок */}
                  {filteredAndSortedDeals.length > 0 ? (
                    filteredAndSortedDeals.map((deal) => {
                        const stage = sortedStages.find((s) => s.id === deal.stage_id)
                        const stageColor = stage?.color || '#6c757d'
                        
                        return (
                          <div
                            key={deal.id}
                            className="d-flex align-items-center py-2 px-3 mb-1"
                            style={{
                              backgroundColor: '#fff',
                              borderRadius: '0.35rem',
                              border: '1px solid #e9ecef',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onClick={() => handleDealClick(deal)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8f9fa'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#fff'
                            }}
                          >
                            <div style={{ flex: 2 }}>
                              <span className="fw-semibold">{deal.title}</span>
                              {deal.description && (
                                <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }}>
                                  {deal.description}
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <span 
                                className="badge" 
                                style={{ 
                                  backgroundColor: stageColor,
                                  color: '#fff',
                                }}
                              >
                                {stage?.name || 'Без стадии'}
                              </span>
                            </div>
                            <div style={{ flex: 1 }}>
                              {deal.amount ? (
                                <span className="fw-semibold">
                                  {deal.amount.toLocaleString('ru-RU')} {deal.currency || 'RUB'}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </div>
                            <div style={{ flex: 1 }} className="text-muted small">
                              {new Date(deal.created_at).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                        )
                      })
                  ) : (
                    <div className="text-center py-4 text-muted">
                      <IconifyIcon icon="bx:inbox" className="fs-32 mb-2" />
                      <div>Нет сделок</div>
                    </div>
                  )}
                  
                  {/* Кнопка добавления сделки */}
                  <div className="mt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowAddDealModal(true)}
                      className="d-flex align-items-center gap-2"
                    >
                      <IconifyIcon icon="bx:plus" />
                      Добавить сделку
                    </Button>
                  </div>
                </div>
              )}
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

