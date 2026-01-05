import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, CardHeader, Col, Row, Form, InputGroup, Dropdown, Badge } from 'react-bootstrap'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import { useDealCategory } from '@/hooks/useDealCategory'
import { useDealsByCategory } from '@/hooks/useDealsByCategory'
import { useMoveDealToStage } from '@/hooks/useMoveDealToStage'
import { useDeleteDealCategory } from '@/hooks/useDeleteDealCategory'
import type { Deal } from '@/hooks/useDealsByCategory'
import AddDealModal from './components/AddDealModal'
import AddDealStageModal from './components/AddDealStageModal'
import EditDealModal from './components/EditDealModal'
import EditDealStageModal from './components/EditDealStageModal'

const DealCategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { category, loading: categoryLoading, error: categoryError, refetch: refetchCategory } = useDealCategory(categoryId)
  const { deals, loading: dealsLoading, refetch: refetchDeals } = useDealsByCategory(categoryId, { activeOnly: true })
  const { deleteCategory, loading: deleteCategoryLoading } = useDeleteDealCategory(() => {
    navigate('/deals')
  })
  const [showAddStageModal, setShowAddStageModal] = useState(false)
  const [showAddDealModal, setShowAddDealModal] = useState(false)
  const [showEditDealModal, setShowEditDealModal] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [showEditStageModal, setShowEditStageModal] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<{ stageId: string; index: number } | null>(null)
  const [viewMode, setViewMode] = useState<'columns' | 'list'>('columns')
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false)
  
  // Поиск, сортировка, фильтрация
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'order' | 'created_at' | 'amount' | 'title'>('order')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
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
  const filteredAndSortedDeals = (deals || [])
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
      if (sortField === 'order') {
        comparison = a.order - b.order
      } else if (sortField === 'created_at') {
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
    order: 'Порядок',
    created_at: 'Дата создания',
    amount: 'Сумма',
    title: 'Название',
  }

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDealId(dealId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', dealId)
  }

  const handleDragEnd = () => {
    setDraggedDealId(null)
    setDragOverStageId(null)
    setDragOverPosition(null)
  }

  // Группируем сделки по стадиям (выносим выше, чтобы использовать в обработчиках)
  // Применяем поиск для фильтрации в режиме колонок
  const dealsByStageMap = useMemo(() => {
    const filteredDealsForColumns = (deals || []).filter((deal) => {
      if (searchQuery && !deal.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
    
    const map: Record<string, Deal[]> = {}
    filteredDealsForColumns.forEach((deal) => {
      if (!map[deal.stage_id]) {
        map[deal.stage_id] = []
      }
      map[deal.stage_id].push(deal)
    })
    
    // Сортируем сделки внутри каждой стадии по выбранному полю
    Object.keys(map).forEach((stageId) => {
      map[stageId].sort((a, b) => {
        let comparison = 0
        if (sortField === 'order') {
          comparison = a.order - b.order
        } else if (sortField === 'created_at') {
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        } else if (sortField === 'amount') {
          comparison = (a.amount || 0) - (b.amount || 0)
        } else if (sortField === 'title') {
          comparison = a.title.localeCompare(b.title)
        }
        return sortDirection === 'asc' ? comparison : -comparison
      })
    })
    
    return map
  }, [deals, searchQuery, sortField, sortDirection])

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStageId(stageId)

    if (!draggedDealId) return

    const card = e.currentTarget as HTMLElement
    // Находим CardBody для правильного вычисления координат
    const cardBody = card.querySelector('.card-body') as HTMLElement
    if (!cardBody) {
      setDragOverPosition({ stageId, index: 0 })
      return
    }

    // Используем CardBody для вычисления координат, но ищем элементы внутри всего Card
    const rect = cardBody.getBoundingClientRect()
    const y = e.clientY - rect.top

    const dealElements = card.querySelectorAll('[data-deal-id]')
    let insertIndex = dealElements.length

    if (dealElements.length === 0) {
      insertIndex = 0
    } else {
      let found = false
      
      // Проверяем каждый элемент
      for (let index = 0; index < dealElements.length; index++) {
        const element = dealElements[index] as HTMLElement
        const elementRect = element.getBoundingClientRect()
        const elementTop = elementRect.top - rect.top
        const elementBottom = elementRect.bottom - rect.top
        const elementCenter = (elementTop + elementBottom) / 2

        // Если курсор находится в пределах элемента
        if (y >= elementTop && y <= elementBottom) {
          insertIndex = y < elementCenter ? index : index + 1
          found = true
          break
        }
        
        // Если курсор выше первого элемента
        if (index === 0 && y < elementTop) {
          insertIndex = 0
          found = true
          break
        }
        
        // Если курсор между элементами
        if (index < dealElements.length - 1) {
          const nextElement = dealElements[index + 1] as HTMLElement
          const nextElementRect = nextElement.getBoundingClientRect()
          const nextElementTop = nextElementRect.top - rect.top
          
          if (y > elementBottom && y < nextElementTop) {
            insertIndex = index + 1
            found = true
            break
          }
        }
      }
      
      // Если не нашли позицию, значит курсор ниже последнего элемента
      if (!found) {
        insertIndex = dealElements.length
      }
    }

    setDragOverPosition({ stageId, index: insertIndex })
  }

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const currentDragOverPosition = dragOverPosition
    
    const dealId = e.dataTransfer.getData('text/plain')
    if (!dealId || !draggedDealId) {
      return
    }

    const deal = (deals || []).find((d) => d.id === dealId)
    if (!deal) {
      return
    }

    // Определяем позицию вставки
    const stageDeals = dealsByStageMap[targetStageId] || []
    let insertIndex = stageDeals.length
    
    // Используем сохраненную позицию из dragOverPosition
    if (currentDragOverPosition && currentDragOverPosition.stageId === targetStageId) {
      insertIndex = currentDragOverPosition.index
    }

    // Проверяем, изменилась ли позиция (если перемещаем в ту же стадию)
    if (deal.stage_id === targetStageId) {
      const currentIndex = stageDeals.findIndex((d) => d.id === dealId)
      if (currentIndex === insertIndex || (currentIndex === insertIndex - 1 && insertIndex > 0)) {
        setDragOverPosition(null)
        return // Позиция не изменилась
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
        order = firstDeal.order - 1
      }
    } else if (insertIndex >= stageDeals.length) {
      // Вставляем в конец
      if (stageDeals.length === 0) {
        order = 0
      } else {
        const lastDeal = stageDeals[stageDeals.length - 1]
        order = lastDeal.order + 1
      }
    } else {
      // Вставляем между карточками
      const prevDeal = stageDeals[insertIndex - 1]
      const nextDeal = stageDeals[insertIndex]
      
      // Вычисляем средний order между предыдущей и следующей карточками
      const orderDiff = nextDeal.order - prevDeal.order
      if (orderDiff > 1) {
        // Есть место между порядками
        order = Math.floor((prevDeal.order + nextDeal.order) / 2)
      } else {
        // Порядки слишком близки, используем порядок следующей карточки
        order = nextDeal.order
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

  // Сортируем стадии по порядку и фильтруем только активные
  const sortedStages = category.stages 
    ? [...category.stages]
        .filter((stage) => stage.is_active !== false) // Показываем только активные стадии
        .sort((a, b) => a.order - b.order) 
    : []
  
  // Фильтруем стадии для отображения в режиме колонок (если выбран фильтр по стадии)
  const filteredStages = filterStageId 
    ? sortedStages.filter((stage) => stage.id === filterStageId)
    : sortedStages

  const renderPlaceholder = (stageId: string, index: number) => {
    if (
      dragOverPosition &&
      dragOverPosition.stageId === stageId &&
      dragOverPosition.index === index &&
      draggedDealId
    ) {
      return (
        <div
          style={{
            height: '4px',
            backgroundColor: '#0d6efd',
            borderRadius: '2px',
            margin: '4px 0',
            transition: 'all 0.2s ease',
          }}
        />
      )
    }
    return null
  }

  return (
    <>
      <PageBreadcrumb subName="Сделки" title={category.name} />
      <PageMetaData title={category.name} />

      {/* Кнопка удаления категории */}
      <div className="d-flex justify-content-end align-items-center mb-3">
        {showDeleteCategoryConfirm ? (
          <div className="d-flex align-items-center gap-2">
            <span className="text-danger small">Удалить категорию?</span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => categoryId && deleteCategory(categoryId)}
              disabled={deleteCategoryLoading}
            >
              {deleteCategoryLoading ? 'Удаление...' : 'Да'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteCategoryConfirm(false)}
              disabled={deleteCategoryLoading}
            >
              Нет
            </Button>
          </div>
        ) : (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => setShowDeleteCategoryConfirm(true)}
            className="d-flex align-items-center gap-1"
          >
            <IconifyIcon icon="bx:trash" />
            Удалить категорию
          </Button>
        )}
      </div>

      <Row>
        <Col xs={12}>
          {/* Стадии и сделки в одной обертке */}
          <Card>
            <CardBody>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <h5 className="mb-0">Воронка продаж</h5>
                  <span className="text-muted small">
                    ({(deals || []).length} {(deals || []).length === 1 ? 'сделка' : (deals || []).length >= 2 && (deals || []).length <= 4 ? 'сделки' : 'сделок'}
                    {(deals || []).length > 0 && `, ожидается ${(deals || []).reduce((sum, deal) => sum + (deal.amount || 0), 0).toLocaleString('ru-RU')} ₽`})
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
                      active={sortField === 'order'} 
                      onClick={() => setSortField('order')}
                    >
                      Порядок
                    </Dropdown.Item>
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
                <div 
                  className="d-flex gap-3"
                  style={{ 
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    minHeight: 'calc(100vh - 400px)',
                    paddingBottom: '1rem',
                  }}
                >
                  {filteredStages.map((stage) => {
                    const stageDeals = dealsByStageMap[stage.id] || []
                    const isFirstStage = stage.order === filteredStages[0]?.order
                    const stageColor = stage.color || '#6c757d'

                    return (
                      <div 
                        key={stage.id} 
                        className="d-flex flex-column"
                        style={{
                          minWidth: '300px',
                          width: '300px',
                          flexShrink: 0,
                        }}
                      >
                        <Card
                          style={{
                            height: '100%',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                          onDragOver={(e) => handleDragOver(e, stage.id)}
                          onDrop={(e) => handleDrop(e, stage.id)}
                        >
                          <CardHeader
                            style={{
                              borderTop: `3px solid ${stageColor}`,
                              backgroundColor: '#f8f9fa',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleStageClick(stage.id)}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <h6 className="mb-0 fw-semibold">{stage.name}</h6>
                              <Badge bg="light" text="dark">
                                {stageDeals.length}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardBody
                            className="p-2"
                            style={{
                              flex: 1,
                              overflowY: 'auto',
                              minHeight: '400px',
                            }}
                          >
                            {/* Кнопка добавления сделки только для первой стадии */}
                            {isFirstStage && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="w-100 mb-2"
                                style={{ fontSize: '0.875rem' }}
                                onClick={() => setShowAddDealModal(true)}
                              >
                                <IconifyIcon icon="bx:plus" className="me-1" />
                                Добавить сделку
                              </Button>
                            )}

                            <div className="d-flex flex-column">
                              {stageDeals.length > 0 ? (
                                <>
                                  {renderPlaceholder(stage.id, 0)}
                                  {stageDeals.map((deal, index) => (
                                    <div key={deal.id}>
                                      <Card
                                        data-deal-id={deal.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, deal.id)}
                                        onDragEnd={handleDragEnd}
                                        style={{
                                          marginBottom: '8px',
                                          cursor: 'grab',
                                          borderLeft: `3px solid ${stageColor}`,
                                        }}
                                        className="shadow-sm"
                                      >
                                        <CardBody className="p-3">
                                          <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="mb-0" style={{ fontSize: '0.9rem' }}>
                                              {deal.title}
                                            </h6>
                                            <Dropdown align="end">
                                              <Dropdown.Toggle
                                                as="button"
                                                className="btn btn-link btn-sm p-0"
                                                style={{
                                                  border: 'none',
                                                  background: 'transparent',
                                                  color: '#6c757d',
                                                }}
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                }}
                                              >
                                                <IconifyIcon icon="bx:dots-vertical-rounded" />
                                              </Dropdown.Toggle>
                                              <Dropdown.Menu>
                                                <Dropdown.Item onClick={() => handleDealClick(deal)}>
                                                  <IconifyIcon icon="bx:pencil" className="me-2" />
                                                  Редактировать
                                                </Dropdown.Item>
                                              </Dropdown.Menu>
                                            </Dropdown>
                                          </div>
                                          {deal.description && (
                                            <p className="text-muted small mb-2" style={{ fontSize: '0.8rem' }}>
                                              {deal.description}
                                            </p>
                                          )}
                                          <div className="d-flex flex-wrap gap-2 align-items-center">
                                            {deal.amount && (
                                              <span className="small fw-semibold">
                                                <IconifyIcon icon="bx:dollar" className="me-1" />
                                                {deal.amount.toLocaleString('ru-RU')} {deal.currency || 'RUB'}
                                              </span>
                                            )}
                                            <span className="small text-muted">
                                              <IconifyIcon icon="bx:calendar" className="me-1" />
                                              {new Date(deal.created_at).toLocaleDateString('ru-RU')}
                                            </span>
                                            {!deal.is_active && (
                                              <Badge bg="secondary">Закрыта</Badge>
                                            )}
                                          </div>
                                        </CardBody>
                                      </Card>
                                      {renderPlaceholder(stage.id, index + 1)}
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <div className="text-center py-3 text-muted small">
                                  <IconifyIcon icon="bx:inbox" className="fs-24 mb-2" />
                                  <div>Нет сделок</div>
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    )
                  })}
                  {/* Кнопка добавления стадии справа */}
                  <div 
                    className="d-flex flex-column"
                    style={{
                      minWidth: '300px',
                      width: '300px',
                      flexShrink: 0,
                    }}
                  >
                    <Card
                      style={{
                        height: '100%',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '2px dashed #dee2e6',
                      }}
                    >
                      <CardHeader
                        style={{
                          backgroundColor: '#f8f9fa',
                        }}
                      >
                        <div className="d-flex justify-content-center align-items-center">
                          <Button
                            variant="light"
                            size="sm"
                            onClick={() => setShowAddStageModal(true)}
                            className="d-flex align-items-center justify-content-center gap-2"
                            style={{ border: 'none', padding: '0', background: 'transparent' }}
                          >
                            <IconifyIcon icon="bx:plus" className="fs-18" />
                            <span className="small">Добавить стадию</span>
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
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
            currentStages={sortedStages}
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
              onDealDeleted={handleDealUpdated}
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
              currentStages={sortedStages}
              stageId={selectedStageId}
              onStageUpdated={handleStageUpdated}
              onStageDeleted={handleStageUpdated}
            />
          )}
        </>
      )}
    </>
  )
}

export default DealCategoryPage

