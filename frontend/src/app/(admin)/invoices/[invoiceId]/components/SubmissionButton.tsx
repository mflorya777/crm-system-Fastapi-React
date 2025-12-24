import { Button } from 'react-bootstrap'

const SubmissionButton = () => {
  return (
    <div className="text-end d-print-none">
      <Button variant="primary" onClick={() => window.print()} className="me-1">
        Печать
      </Button>
      <Button variant="outline-primary">Отправить</Button>
    </div>
  )
}

export default SubmissionButton
