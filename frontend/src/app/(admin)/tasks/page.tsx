'use client';

import { useState, useRef } from 'react';
import { Card, CardBody, Row, Col, Badge, Button, Dropdown } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import PageBreadcrumb from '@/components/layout/PageBreadcrumb';

// Моковые данные для задач
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: string;
  order: number;
}

interface TaskStage {
  id: string;
  name: string;
  color: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
}

// Моковые стадии
const mockStages: TaskStage[] = [
  { id: 'todo', name: 'К выполнению', color: '#6c757d', status: 'todo' },
  { id: 'in_progress', name: 'В работе', color: '#0d6efd', status: 'in_progress' },
  { id: 'review', name: 'На проверке', color: '#ffc107', status: 'review' },
  { id: 'done', name: 'Выполнено', color: '#198754', status: 'done' },
];

// Моковые задачи
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Разработать API для задач',
    description: 'Создать REST API endpoints для управления задачами',
    status: 'todo',
    priority: 'high',
    assignee: 'Иванов И.И.',
    dueDate: '2026-01-10',
    order: 0,
  },
  {
    id: '2',
    title: 'Настроить CI/CD',
    description: 'Настроить автоматическую сборку и деплой',
    status: 'in_progress',
    priority: 'medium',
    assignee: 'Петров П.П.',
    dueDate: '2026-01-08',
    order: 0,
  },
  {
    id: '3',
    title: 'Исправить баги в чате',
    description: 'Исправить проблемы с отображением сообщений',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Сидоров С.С.',
    dueDate: '2026-01-05',
    order: 1,
  },
  {
    id: '4',
    title: 'Обновить документацию',
    description: 'Обновить API документацию',
    status: 'review',
    priority: 'low',
    assignee: 'Иванов И.И.',
    dueDate: '2026-01-12',
    order: 0,
  },
  {
    id: '5',
    title: 'Провести код-ревью',
    description: 'Проверить код последних изменений',
    status: 'done',
    priority: 'medium',
    assignee: 'Петров П.П.',
    dueDate: '2026-01-03',
    order: 0,
  },
  {
    id: '6',
    title: 'Оптимизировать запросы к БД',
    description: 'Улучшить производительность запросов',
    status: 'todo',
    priority: 'medium',
    assignee: 'Сидоров С.С.',
    dueDate: '2026-01-15',
    order: 1,
  },
];

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<{ stageId: string; index: number } | null>(null);

  // Группируем задачи по статусам
  const tasksByStage = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Сортируем задачи по order
  Object.keys(tasksByStage).forEach((status) => {
    tasksByStage[status].sort((a, b) => a.order - b.order);
  });

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStageId(stageId);

    if (!draggedTaskId) return;

    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const taskElements = container.querySelectorAll('[data-task-id]');
    let insertIndex = taskElements.length;

    taskElements.forEach((element, index) => {
      const elementRect = element.getBoundingClientRect();
      const elementTop = elementRect.top - rect.top;
      const elementBottom = elementRect.bottom - rect.top;
      const elementCenter = (elementTop + elementBottom) / 2;

      if (y >= elementTop && y <= elementBottom) {
        insertIndex = y < elementCenter ? index : index + 1;
      }
    });

    setDragOverPosition({ stageId, index: insertIndex });
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId || !draggedTaskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const targetStage = mockStages.find((s) => s.id === targetStageId);
    if (!targetStage) return;

    const stageTasks = tasksByStage[targetStageId] || [];
    const currentDragOverPosition = dragOverPosition;

    let insertIndex = stageTasks.length;
    if (currentDragOverPosition && currentDragOverPosition.stageId === targetStageId) {
      insertIndex = currentDragOverPosition.index;
    }

    // Обновляем задачи
    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: targetStage.status,
            order: insertIndex,
          };
        }
        // Обновляем order для задач в целевой стадии
        if (t.status === targetStage.status && t.id !== taskId) {
          if (t.order >= insertIndex) {
            return { ...t, order: t.order + 1 };
          }
        }
        // Обновляем order для задач в исходной стадии
        if (t.status === task.status && t.id !== taskId && t.order > task.order) {
          return { ...t, order: t.order - 1 };
        }
        return t;
      });
      return updatedTasks;
    });

    setDraggedTaskId(null);
    setDragOverStageId(null);
    setDragOverPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStageId(null);
    setDragOverPosition(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return priority;
    }
  };

  const renderPlaceholder = (stageId: string, index: number) => {
    if (
      dragOverPosition &&
      dragOverPosition.stageId === stageId &&
      dragOverPosition.index === index &&
      draggedTaskId
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
      );
    }
    return null;
  };

  return (
    <>
      <PageBreadcrumb title="Задачи" subName="" />
      <Row className="mt-3">
        <Col xs={12}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Kanban доска</h4>
            <Button variant="primary" size="sm">
              <IconifyIcon icon="bx:plus" className="me-1" />
              Новая задача
            </Button>
          </div>

          <Row className="g-3" style={{ minHeight: 'calc(100vh - 250px)' }}>
            {mockStages.map((stage) => {
              const stageTasks = tasksByStage[stage.status] || [];
              const isFirstStage = stage.id === mockStages[0].id;

              return (
                <Col key={stage.id} md={3} className="d-flex flex-column">
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
                    <Card.Header
                      style={{
                        borderTop: `3px solid ${stage.color}`,
                        backgroundColor: '#f8f9fa',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-semibold">{stage.name}</h6>
                        <Badge bg="light" text="dark">
                          {stageTasks.length}
                        </Badge>
                      </div>
                    </Card.Header>
                    <CardBody
                      className="p-2"
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        minHeight: '400px',
                      }}
                    >
                      {isFirstStage && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="w-100 mb-2"
                          style={{ fontSize: '0.875rem' }}
                        >
                          <IconifyIcon icon="bx:plus" className="me-1" />
                          Добавить задачу
                        </Button>
                      )}

                      <div className="d-flex flex-column">
                        {renderPlaceholder(stage.id, 0)}
                        {stageTasks.map((task, index) => (
                          <div key={task.id}>
                            <Card
                              data-task-id={task.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              onDragEnd={handleDragEnd}
                              style={{
                                marginBottom: '8px',
                                cursor: 'grab',
                                borderLeft: `3px solid ${stage.color}`,
                              }}
                              className="shadow-sm"
                            >
                              <CardBody className="p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="mb-0" style={{ fontSize: '0.9rem' }}>
                                    {task.title}
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
                                    >
                                      <IconifyIcon icon="bx:dots-vertical-rounded" />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                      <Dropdown.Item>
                                        <IconifyIcon icon="bx:pencil" className="me-2" />
                                        Редактировать
                                      </Dropdown.Item>
                                      <Dropdown.Item className="text-danger">
                                        <IconifyIcon icon="bx:trash" className="me-2" />
                                        Удалить
                                      </Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                </div>

                                {task.description && (
                                  <p className="text-muted small mb-2" style={{ fontSize: '0.8rem' }}>
                                    {task.description}
                                  </p>
                                )}

                                <div className="d-flex flex-wrap gap-2 align-items-center">
                                  <Badge bg={getPriorityColor(task.priority)}>
                                    {getPriorityLabel(task.priority)}
                                  </Badge>
                                  {task.assignee && (
                                    <span className="small text-muted">
                                      <IconifyIcon icon="bx:user" className="me-1" />
                                      {task.assignee}
                                    </span>
                                  )}
                                  {task.dueDate && (
                                    <span className="small text-muted">
                                      <IconifyIcon icon="bx:calendar" className="me-1" />
                                      {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                                    </span>
                                  )}
                                </div>
                              </CardBody>
                            </Card>
                            {renderPlaceholder(stage.id, index + 1)}
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Col>
      </Row>
    </>
  );
};

export default TasksPage;

