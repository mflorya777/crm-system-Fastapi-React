import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, Col, Row, Form, InputGroup, Dropdown } from 'react-bootstrap'

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
  const [draggedCardHeight, setDraggedCardHeight] = useState<number>(80)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)
  const [dragOverPosition, setDragOverPosition] = useState<{ stageId: string; index: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartedRef = useRef(false)
  const [viewMode, setViewMode] = useState<'columns' | 'list'>('columns')
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false)
  
  // Поиск, сортировка, фильтрация
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'created_at' | 'value' | 'name'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
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
      if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortField === 'value') {
        comparison = (a.value || 0) - (b.value || 0)
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name)
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }

  const sortFieldLabels: Record<string, string> = {
    created_at: 'Дата создания',
    value: 'Сумма',
    name: 'Имя',
  }

  const handleDragStart = (e: React.DragEvent, buyerId: string) => {
    dragStartedRef.current = true
    setIsDragging(true)
    setDraggedBuyerId(buyerId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', buyerId)
    if (e.currentTarget instanceof HTMLElement) {
      const rect = e.currentTarget.getBoundingClientRect()
      setDraggedCardHeight(rect.height || 80)
      e.currentTarget.style.opacity = '0.4'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false)
    setDraggedBuyerId(null)
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

  // Группируем покупателей по стадиям (выносим выше, чтобы использовать в обработчиках)
  // Применяем поиск для фильтрации в режиме колонок
  const filteredBuyersForColumns = buyers.filter((buyer) => {
    if (searchQuery && !buyer.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })
  
  const buyersByStageMap: Record<string, Buyer[]> = {}
  filteredBuyersForColumns.forEach((buyer) => {
    if (!buyersByStageMap[buyer.stage_id]) {
      buyersByStageMap[buyer.stage_id] = []
    }
    buyersByStageMap[buyer.stage_id].push(buyer)
  })
  
  // Сортируем покупателей внутри каждой стадии по выбранному полю
  Object.keys(buyersByStageMap).forEach((stageId) => {
    buyersByStageMap[stageId].sort((a, b) => {
      let comparison = 0
      if (sortField === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortField === 'value') {
        comparison = (a.value || 0) - (b.value || 0)
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else {
        // По умолчанию сортируем по order
        comparison = a.order - b.order
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  })

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStageId(stageId)
    
    const stageBuyers = buyersByStageMap[stageId] || []
    const container = e.currentTarget as HTMLElement
    const rect = container.getBoundingClientRect()
    const y = e.clientY - rect.top
    const threshold = Math.max(12, draggedCardHeight / 6) // слегка расширяем верх/низ зоны карточки
    
    // Находим все карточки в контейнере
    const buyerElements = container.querySelectorAll('[data-buyer-id]')
    let insertIndex = stageBuyers.length
    
    if (buyerElements.length === 0) {
      // Нет карточек, вставляем в начало
      insertIndex = 0
    } else {
      // Проверяем позицию курсора относительно карточек
      let foundPosition = false
      
      buyerElements.forEach((element, idx) => {
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
        } else if (idx === buyerElements.length - 1 && y > elementBottom) {
          // Курсор ниже последней карточки
          insertIndex = stageBuyers.length
          foundPosition = true
        }
      })
    }
    
    setDragOverPosition({ stageId, index: insertIndex })
  }

  const handleCardDragOver = (e: React.DragEvent, stageId: string, buyerIndex: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const threshold = Math.max(12, draggedCardHeight / 6)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const elementTop = 0
    const elementBottom = rect.height
    const elementCenter = rect.height / 2

    let insertIndex = buyerIndex
    if (y <= elementTop + threshold) {
      insertIndex = buyerIndex
    } else if (y >= elementBottom - threshold) {
      insertIndex = buyerIndex + 1
    } else {
      insertIndex = y < elementCenter ? buyerIndex : buyerIndex + 1
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
    } else {
      // Если позиция не определена, вычисляем на основе координат
      const container = e.currentTarget as HTMLElement
      const rect = container.getBoundingClientRect()
      const y = e.clientY - rect.top
      const threshold = Math.max(12, draggedCardHeight / 6)
      
      const buyerElements = container.querySelectorAll('[data-buyer-id]')
      if (buyerElements.length === 0) {
        insertIndex = 0
      } else {
        let foundPosition = false
        buyerElements.forEach((element, index) => {
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
          } else if (index === buyerElements.length - 1 && y > elementBottom) {
            insertIndex = stageBuyers.length
            foundPosition = true
          }
        })
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
        // Если перемещаем в ту же стадию и это та же карточка, не меняем порядок
        if (buyer.stage_id === targetStageId && buyer.id === firstBuyer.id) {
          setDragOverPosition(null)
          return
        }
        order = firstBuyer.order - 1
      }
    } else if (insertIndex >= stageBuyers.length) {
      // Вставляем в конец
      if (stageBuyers.length === 0) {
        order = 0
      } else {
        const lastBuyer = stageBuyers[stageBuyers.length - 1]
        // Если перемещаем в ту же стадию и это та же карточка, не меняем порядок
        if (buyer.stage_id === targetStageId && buyer.id === lastBuyer.id) {
          setDragOverPosition(null)
          return
        }
        order = lastBuyer.order + 1
      }
    } else {
      // Вставляем между карточками
      const prevBuyer = stageBuyers[insertIndex - 1]
      const nextBuyer = stageBuyers[insertIndex]
      
      // Если перемещаем в ту же стадию и позиция не изменилась, не делаем ничего
      if (buyer.stage_id === targetStageId) {
        const currentIndex = stageBuyers.findIndex((b) => b.id === buyerId)
        if (currentIndex === insertIndex - 1 || currentIndex === insertIndex) {
          setDragOverPosition(null)
          return
        }
      }
      
      // Вычисляем средний order между предыдущей и следующей карточками
      const orderDiff = nextBuyer.order - prevBuyer.order
      if (orderDiff > 1) {
        // Есть место между порядками
        order = Math.floor((prevBuyer.order + nextBuyer.order) / 2)
      } else {
        // Порядки слишком близки, нужно пересчитать порядки всех карточек
        // Для простоты используем порядок следующей карточки
        order = nextBuyer.order
      }
    }

    // Если перемещаем в ту же стадию, проверяем, изменилась ли позиция
    if (buyer.stage_id === targetStageId) {
      const currentIndex = stageBuyers.findIndex((b) => b.id === buyerId)
      if (currentIndex === insertIndex || (currentIndex === insertIndex - 1 && insertIndex > 0)) {
        return // Позиция не изменилась
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

  // Компонент карточки покупателя
  const BuyerCard = ({ buyer }: { buyer: Buyer }) => {
    return (
      <Card 
        className="mb-2" 
        style={{ cursor: 'grab' }}
        draggable
        data-buyer-id={buyer.id}
        onDragStart={(e) => handleDragStart(e, buyer.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => {
          if (!isDragging || !draggedBuyerId) return
          handleCardDragOver(e, buyer.stage_id, (buyersByStageMap[buyer.stage_id] || []).findIndex((b) => b.id === buyer.id))
        }}
        onClick={() => {
          // Предотвращаем открытие модального окна при перетаскивании
          if (dragStartedRef.current || isDragging) {
            return
          }
          handleBuyerClick(buyer)
        }}
      >
        <CardBody className="p-3">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h6 className="mb-0 fw-semibold">{buyer.name}</h6>
          </div>
          {buyer.email && <p className="text-muted small mb-1">{buyer.email}</p>}
          {buyer.phone && <p className="text-muted small mb-1">{buyer.phone}</p>}
          {buyer.company && <p className="text-muted small mb-2"><strong>Компания:</strong> {buyer.company}</p>}
          <div className="d-flex flex-wrap gap-2 mb-2">
            {buyer.value && (
              <div className="d-flex align-items-center gap-1">
                <IconifyIcon icon="bx:dollar" className="fs-14" />
                <span className="small fw-semibold">
                  {buyer.value.toLocaleString('ru-RU')} {buyer.currency || 'RUB'}
                </span>
              </div>
            )}
            <div className="d-flex align-items-center gap-1 text-muted">
              <IconifyIcon icon="bx:calendar" className="fs-14" />
              <span className="small">
                {new Date(buyer.created_at).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
          {!buyer.is_active && (
            <div className="mt-2">
              <span className="badge bg-secondary">Закрыт</span>
            </div>
          )}
        </CardBody>
      </Card>
    )
  }

  return (
    <>
      <PageBreadcrumb subName="Покупатели" title={category.name} />
      <PageMetaData title={category.name} />

      {/* Заголовок с кнопкой удаления категории */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">{category.name}</h4>
        <div className="d-flex gap-2 align-items-center">
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
                    {buyers.length > 0 && `, ожидается ${buyers.reduce((sum, buyer) => sum + (buyer.value || 0), 0).toLocaleString('ru-RU')} ₽`})
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
                      active={sortField === 'created_at'} 
                      onClick={() => setSortField('created_at')}
                    >
                      Дата создания
                    </Dropdown.Item>
                    <Dropdown.Item 
                      active={sortField === 'value'} 
                      onClick={() => setSortField('value')}
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
              <div className="overflow-x-auto pb-2">
                <div className="d-flex gap-3" style={{ flexWrap: 'nowrap' }}>
                  {filteredStages.map((stage, idx) => {
                    const stageBuyers = buyersByStageMap[stage.id] || []
                    const isFirstStage = stage.order === filteredStages[0]?.order
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
                        setDragOverPosition({ stageId: stage.id, index: stageBuyers.length })
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
                            <span className="badge bg-light text-dark">{stageBuyers.length}</span>
                          </div>
                          {/* Кнопка добавления покупателя только для первой стадии */}
                          {isFirstStage && (
                            <div className="mb-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setShowAddBuyerModal(true)}
                                className="w-100 d-flex align-items-center justify-content-center gap-2">
                                <IconifyIcon icon="bx:plus" />
                                Добавить покупателя
                              </Button>
                            </div>
                          )}
                          {/* Список покупателей для этой стадии */}
                          <div 
                            className="d-flex flex-column" 
                            style={{ 
                              minHeight: '120px',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {stageBuyers.length > 0 ? (
                              <>
                                {renderPlaceholder(stage.id, 0)}
                                {stageBuyers.map((buyer, index) => (
                                  <div key={buyer.id}>
                                    <BuyerCard buyer={buyer} />
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
                                    <div>Нет покупателей</div>
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
                              {buyer.value ? (
                                <span className="fw-semibold">
                                  {buyer.value.toLocaleString('ru-RU')} {buyer.currency || 'RUB'}
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

