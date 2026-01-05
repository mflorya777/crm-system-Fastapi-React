import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, CardHeader, Col, Row, Form, InputGroup, Dropdown, Badge } from 'react-bootstrap'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import { useBuyerCategory } from '@/hooks/useBuyerCategory'
import { useBuyersByCategory } from '@/hooks/useBuyersByCategory'
import { useMoveBuyerToStage } from '@/hooks/useMoveBuyerToStage'
import { useDeleteBuyerCategory } from '@/hooks/useDeleteBuyerCategory'
import type { Buyer } from '@/hooks/useBuyersByCategory'
import AddBuyerModal from './components/AddBuyerModal'
import AddBuyerStageModal from './components/AddBuyerStageModal'
import EditBuyerModal from './components/EditBuyerModal'
import EditBuyerStageModal from './components/EditBuyerStageModal'

const BuyerCategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const { category, loading: categoryLoading, error: categoryError, refetch: refetchCategory } = useBuyerCategory(categoryId)
  const { buyers, loading: buyersLoading, refetch: refetchBuyers } = useBuyersByCategory(categoryId, { activeOnly: true })
  const { deleteCategory, loading: deleteCategoryLoading } = useDeleteBuyerCategory(() => {
    navigate('/buyers')
  })
  const [showAddStageModal, setShowAddStageModal] = useState(false)
  const [showAddBuyerModal, setShowAddBuyerModal] = useState(false)
  const [showEditBuyerModal, setShowEditBuyerModal] = useState(false)
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null)
  const [showEditStageModal, setShowEditStageModal] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const [draggedBuyerId, setDraggedBuyerId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<{ stageId: string; index: number } | null>(null)
  const [viewMode, setViewMode] = useState<'columns' | 'list'>('columns')
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false)
  
  // Поиск, сортировка, фильтрация
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'order' | 'created_at' | 'potential_value' | 'name'>('order')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterStageId, setFilterStageId] = useState<string | null>(null)

  const { moveBuyerToStage } = useMoveBuyerToStage(() => {
    refetchBuyers()
  })

  const handleStageAdded = async () => {
    await refetchCategory()
    await refetchBuyers()
  }

  const handleStageUpdated = async () => {
    await refetchCategory()
    await refetchBuyers()
  }

  const handleStageClick = (stageId: string) => {
    setSelectedStageId(stageId)
    setShowEditStageModal(true)
  }

  const handleBuyerCreated = () => {
    refetchBuyers()
  }

  const handleBuyerClick = (buyer: Buyer) => {
    setSelectedBuyer(buyer)
    setShowEditBuyerModal(true)
  }

  const handleBuyerUpdated = () => {
    refetchBuyers()
  }

  // Фильтрация и сортировка покупателей
  const filteredAndSortedBuyers = buyers
    .filter((buyer) => {
      // Поиск по имени
      if (searchQuery && !buyer.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Фильтр по стадии
      if (filterStageId && buyer.stage_id !== filterStageId) {
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
      } else if (sortField === 'potential_value') {
        comparison = (a.potential_value || 0) - (b.potential_value || 0)
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name)
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

  const sortFieldLabels: Record<string, string> = {
    order: 'Порядок',
    created_at: 'Дата создания',
    potential_value: 'Сумма',
    name: 'Имя',
  }

  const handleDragStart = (e: React.DragEvent, buyerId: string) => {
    setDraggedBuyerId(buyerId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', buyerId)
  }

  const handleDragEnd = () => {
    setDraggedBuyerId(null)
    setDragOverStageId(null)
    setDragOverPosition(null)
  }

  // Группируем покупателей по стадиям (выносим выше, чтобы использовать в обработчиках)
  // Применяем поиск для фильтрации в режиме колонок
  const buyersByStageMap = useMemo(() => {
    const filteredBuyersForColumns = (buyers || []).filter((buyer) => {
      if (searchQuery && !buyer.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      return true
    })
    
    const map: Record<string, Buyer[]> = {}
    filteredBuyersForColumns.forEach((buyer) => {
      if (!map[buyer.stage_id]) {
        map[buyer.stage_id] = []
      }
      map[buyer.stage_id].push(buyer)
    })
    
    // Сортируем покупателей внутри каждой стадии по выбранному полю
    Object.keys(map).forEach((stageId) => {
      map[stageId].sort((a, b) => {
        let comparison = 0
        if (sortField === 'order') {
          comparison = a.order - b.order
        } else if (sortField === 'created_at') {
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        } else if (sortField === 'potential_value') {
          comparison = (a.potential_value || 0) - (b.potential_value || 0)
        } else if (sortField === 'name') {
          comparison = a.name.localeCompare(b.name)
        }
        return sortDirection === 'asc' ? comparison : -comparison
      })
    })
    
    return map
  }, [buyers, searchQuery, sortField, sortDirection])

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStageId(stageId)

    if (!draggedBuyerId) return

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

    const buyerElements = card.querySelectorAll('[data-buyer-id]')
    let insertIndex = buyerElements.length

    if (buyerElements.length === 0) {
      insertIndex = 0
    } else {
      let found = false
      
      // Проверяем каждый элемент
      for (let index = 0; index < buyerElements.length; index++) {
        const element = buyerElements[index] as HTMLElement
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
        if (index < buyerElements.length - 1) {
          const nextElement = buyerElements[index + 1] as HTMLElement
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
        insertIndex = buyerElements.length
      }
    }

    setDragOverPosition({ stageId, index: insertIndex })
  }

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const currentDragOverPosition = dragOverPosition
    
    const buyerId = e.dataTransfer.getData('text/plain')
    if (!buyerId || !draggedBuyerId) {
      return
    }

    const buyer = buyers.find((b) => b.id === buyerId)
    if (!buyer) {
      return
    }

    // Определяем позицию вставки
    const stageBuyers = buyersByStageMap[targetStageId] || []
    let insertIndex = stageBuyers.length
    
    // Используем сохраненную позицию из dragOverPosition
    if (currentDragOverPosition && currentDragOverPosition.stageId === targetStageId) {
      insertIndex = currentDragOverPosition.index
    }

    // Проверяем, изменилась ли позиция (если перемещаем в ту же стадию)
    if (buyer.stage_id === targetStageId) {
      const currentIndex = stageBuyers.findIndex((b) => b.id === buyerId)
      if (currentIndex === insertIndex || (currentIndex === insertIndex - 1 && insertIndex > 0)) {
        setDragOverPosition(null)
        return // Позиция не изменилась
      }
    }

    // Вычисляем order на основе позиции вставки
    let order: number
    if (insertIndex === 0) {
      // Вставляем в начало
      if (stageBuyers.length === 0) {
        order = 0
      } else {
        const firstBuyer = stageBuyers[0]
        order = firstBuyer.order - 1
      }
    } else if (insertIndex >= stageBuyers.length) {
      // Вставляем в конец
      if (stageBuyers.length === 0) {
        order = 0
      } else {
        const lastBuyer = stageBuyers[stageBuyers.length - 1]
        order = lastBuyer.order + 1
      }
    } else {
      // Вставляем между карточками
      const prevBuyer = stageBuyers[insertIndex - 1]
      const nextBuyer = stageBuyers[insertIndex]
      
      // Вычисляем средний order между предыдущей и следующей карточками
      const orderDiff = nextBuyer.order - prevBuyer.order
      if (orderDiff > 1) {
        // Есть место между порядками
        order = Math.floor((prevBuyer.order + nextBuyer.order) / 2)
      } else {
        // Порядки слишком близки, используем порядок следующей карточки
        order = nextBuyer.order
      }
    }

    try {
      await moveBuyerToStage(buyerId, targetStageId, order)
    } catch (error) {
      console.error('Failed to move buyer:', error)
    } finally {
      setDragOverStageId(null)
      setDragOverPosition(null)
    }
  }

  // Показываем спиннер только при первой загрузке, когда данных еще нет
  if ((categoryLoading || buyersLoading) && !category) {
    return (
      <>
        <PageBreadcrumb subName="Покупатели" title="Загрузка..." />
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
        <PageBreadcrumb subName="Покупатели" title="Ошибка" />
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
      draggedBuyerId
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
      <PageBreadcrumb subName="Покупатели" title={category.name} />
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
          {/* Стадии и покупатели в одной обертке */}
          <Card>
            <CardBody>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <h5 className="mb-0">Воронка покупателей</h5>
                  <span className="text-muted small">
                    ({buyers.length} {buyers.length === 1 ? 'покупатель' : buyers.length >= 2 && buyers.length <= 4 ? 'покупателя' : 'покупателей'}
                    {buyers.length > 0 && `, ожидается ${buyers.reduce((sum, buyer) => sum + (buyer.potential_value || 0), 0).toLocaleString('ru-RU')} ₽`})
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
                    placeholder="Поиск по имени..."
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
                      active={sortField === 'potential_value'} 
                      onClick={() => setSortField('potential_value')}
                    >
                      Сумма
                    </Dropdown.Item>
                    <Dropdown.Item 
                      active={sortField === 'name'} 
                      onClick={() => setSortField('name')}
                    >
                      Имя
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
                <div className="overflow-x-auto pb-2" style={{ overflowY: 'hidden' }}>
                  <div className="d-flex gap-3" style={{ flexWrap: 'nowrap' }}>
                    {filteredStages.map((stage) => {
                      const stageBuyers = buyersByStageMap[stage.id] || []
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
                                  {stageBuyers.length}
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
                              {/* Кнопка добавления покупателя только для первой стадии */}
                              {isFirstStage && (
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="w-100 mb-2"
                                  style={{ fontSize: '0.875rem' }}
                                  onClick={() => setShowAddBuyerModal(true)}
                                >
                                  <IconifyIcon icon="bx:plus" className="me-1" />
                                  Добавить покупателя
                                </Button>
                              )}

                              <div className="d-flex flex-column">
                                {stageBuyers.length > 0 ? (
                                  <>
                                    {renderPlaceholder(stage.id, 0)}
                                    {stageBuyers.map((buyer, index) => (
                                      <div key={buyer.id}>
                                        <Card
                                          data-buyer-id={buyer.id}
                                          draggable
                                          onDragStart={(e) => handleDragStart(e, buyer.id)}
                                          onDragEnd={handleDragEnd}
                                          style={{
                                            marginBottom: '8px',
                                            cursor: 'grab',
                                            borderLeft: `3px solid ${stageColor}`,
                                          }}
                                          className="shadow-sm"
                                          onClick={() => handleBuyerClick(buyer)}
                                        >
                                          <CardBody className="p-3">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                              <h6 className="mb-0" style={{ fontSize: '0.9rem' }}>
                                                {buyer.name}
                                              </h6>
                                            </div>
                                            {buyer.email && (
                                              <p className="text-muted small mb-1" style={{ fontSize: '0.8rem' }}>
                                                {buyer.email}
                                              </p>
                                            )}
                                            {buyer.phone && (
                                              <p className="text-muted small mb-1" style={{ fontSize: '0.8rem' }}>
                                                {buyer.phone}
                                              </p>
                                            )}
                                            {buyer.company && (
                                              <p className="text-muted small mb-2" style={{ fontSize: '0.8rem' }}>
                                                <strong>Компания:</strong> {buyer.company}
                                              </p>
                                            )}
                                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                              {buyer.potential_value && (
                                                <span className="small fw-semibold">
                                                  <IconifyIcon icon="bx:dollar" className="me-1" />
                                                  {buyer.potential_value.toLocaleString('ru-RU')} {buyer.currency || 'RUB'}
                                                </span>
                                              )}
                                              <span className="small text-muted">
                                                <IconifyIcon icon="bx:calendar" className="me-1" />
                                                {new Date(buyer.created_at).toLocaleDateString('ru-RU')}
                                              </span>
                                              {!buyer.is_active && (
                                                <Badge bg="secondary">Закрыт</Badge>
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
                                    <div>Нет покупателей</div>
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
                    <div style={{ flex: 2 }}>Имя</div>
                    <div style={{ flex: 1 }}>Стадия</div>
                    <div style={{ flex: 1 }}>Сумма</div>
                    <div style={{ flex: 1 }}>Дата создания</div>
                  </div>
                  
                  {/* Список покупателей */}
                  {filteredAndSortedBuyers.length > 0 ? (
                    filteredAndSortedBuyers.map((buyer) => {
                        const stage = sortedStages.find((s) => s.id === buyer.stage_id)
                        const stageColor = stage?.color || '#6c757d'
                        
                        return (
                          <div
                            key={buyer.id}
                            className="d-flex align-items-center py-2 px-3 mb-1"
                            style={{
                              backgroundColor: '#fff',
                              borderRadius: '0.35rem',
                              border: '1px solid #e9ecef',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onClick={() => handleBuyerClick(buyer)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8f9fa'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#fff'
                            }}
                          >
                            <div style={{ flex: 2 }}>
                              <span className="fw-semibold">{buyer.name}</span>
                              {buyer.email && (
                                <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }}>
                                  {buyer.email}
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
                              {buyer.potential_value ? (
                                <span className="fw-semibold">
                                  {buyer.potential_value.toLocaleString('ru-RU')} {buyer.currency || 'RUB'}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </div>
                            <div style={{ flex: 1 }} className="text-muted small">
                              {new Date(buyer.created_at).toLocaleDateString('ru-RU', {
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
                      <div>Нет покупателей</div>
                    </div>
                  )}
                  
                  {/* Кнопка добавления покупателя */}
                  <div className="mt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowAddBuyerModal(true)}
                      className="d-flex align-items-center gap-2"
                    >
                      <IconifyIcon icon="bx:plus" />
                      Добавить покупателя
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
          <AddBuyerStageModal
            show={showAddStageModal}
            onHide={() => setShowAddStageModal(false)}
            categoryId={categoryId}
            currentStages={sortedStages}
            onStageAdded={handleStageAdded}
          />
          {categoryId && category && (
            <AddBuyerModal
              show={showAddBuyerModal}
              onHide={() => setShowAddBuyerModal(false)}
              categoryId={categoryId}
              category={category}
              onBuyerCreated={handleBuyerCreated}
            />
          )}
          {selectedBuyer && (
            <EditBuyerModal
              show={showEditBuyerModal}
              onHide={() => {
                setShowEditBuyerModal(false)
                setSelectedBuyer(null)
              }}
              buyer={selectedBuyer}
              onBuyerUpdated={handleBuyerUpdated}
              onBuyerDeleted={handleBuyerUpdated}
            />
          )}
          {selectedStageId && categoryId && category && (
            <EditBuyerStageModal
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

export default BuyerCategoryPage

