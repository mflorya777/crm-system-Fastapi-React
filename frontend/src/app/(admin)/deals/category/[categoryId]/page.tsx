import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card, CardBody, Col, Row } from 'react-bootstrap'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageBreadcrumb from '@/components/layout/PageBreadcrumb'
import PageMetaData from '@/components/PageTitle'
import { useDealCategory } from '@/hooks/useDealCategory'
import { useDealsByCategory } from '@/hooks/useDealsByCategory'
import type { DealCategory } from '@/hooks/useDealCategories'
import type { Deal } from '@/hooks/useDealsByCategory'
import AddDealModal from './components/AddDealModal'
import AddDealStageModal from './components/AddDealStageModal'
import DealStages from './components/DealStages'
import DealsList from './components/DealsList'

const DealCategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>()
  const { category, loading: categoryLoading, error: categoryError, refetch: refetchCategory } = useDealCategory(categoryId)
  const { deals, loading: dealsLoading, refetch: refetchDeals } = useDealsByCategory(categoryId, true)
  const [showAddStageModal, setShowAddStageModal] = useState(false)
  const [showAddDealModal, setShowAddDealModal] = useState(false)

  // Группируем сделки по стадиям для отображения количества
  const dealsByStage: Record<string, number> = {}
  deals.forEach((deal) => {
    dealsByStage[deal.stage_id] = (dealsByStage[deal.stage_id] || 0) + 1
  })

  // Получаем первую стадию для добавления сделки
  const firstStage = category?.stages && category.stages.length > 0
    ? [...category.stages].sort((a, b) => a.order - b.order)[0]
    : null

  const handleStageAdded = (updatedCategory: DealCategory) => {
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

  return (
    <>
      <PageBreadcrumb subName="Сделки" title={category.name} />
      <PageMetaData title={category.name} />

      <Row>
        <Col xs={12}>
          {/* Стадии (воронка) */}
          <Card className="mb-4">
            <CardBody>
              <h5 className="mb-3">Воронка продаж</h5>
              <DealStages
                category={category}
                dealsByStage={dealsByStage}
                onAddStageClick={() => setShowAddStageModal(true)}
              />
            </CardBody>
          </Card>

          {/* Кнопка добавления сделки под первой стадией */}
          {firstStage && (
            <div className="mb-3">
              <Button
                variant="primary"
                onClick={() => setShowAddDealModal(true)}
                className="d-flex align-items-center gap-2">
                <IconifyIcon icon="bx:plus" />
                Добавить сделку
              </Button>
            </div>
          )}

          {/* Список сделок */}
          <Card>
            <CardBody>
              <h5 className="mb-3">Сделки ({deals.length})</h5>
              <DealsList deals={deals} category={category} />
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
          {firstStage && categoryId && (
            <AddDealModal
              show={showAddDealModal}
              onHide={() => setShowAddDealModal(false)}
              categoryId={categoryId}
              stageId={firstStage.id}
              onDealCreated={handleDealCreated}
            />
          )}
        </>
      )}
    </>
  )
}

export default DealCategoryPage

