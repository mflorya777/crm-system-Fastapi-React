import IconifyIcon from '@/components/wrappers/IconifyIcon'
import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, CardTitle, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Table } from 'react-bootstrap'

const SalesByCategory = () => {
  const chartOptions: ApexOptions = {
    chart: {
      height: 250,
      type: 'donut',
    },
    legend: {
      show: false,
      position: 'bottom',
      horizontalAlign: 'center',
      offsetX: 0,
      offsetY: -5,
      markers: {
        // width: 9,
        // height: 9,
        // radius: 6,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 0,
      },
    },
    stroke: {
      width: 0,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '80%',
          labels: {
            show: true,
            total: {
              showAlways: true,
              show: true,
            },
          },
        },
      },
    },
    series: [140, 125, 85, 60],
    labels: ['Электроника', 'Продукты', 'Одежда', 'Другое'],
    colors: ['#f9b931', '#ff86c8', '#4ecac2', '#7f56da'],
    dataLabels: {
      enabled: false,
    },
  }
  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle>Продажи по категориям</CardTitle>
        <Dropdown>
          <DropdownToggle as={'a'} role="button" className="arrow-none card-drop">
            <IconifyIcon icon="iconamoon:menu-kebab-vertical-circle-duotone" className="fs-20 align-middle text-muted" />
          </DropdownToggle>
          <DropdownMenu className="dropdown-menu-end">
            <DropdownItem href="">Отчёт о продажах</DropdownItem>
            <DropdownItem href="">Экспорт отчёта</DropdownItem>
            <DropdownItem href="">Прибыль</DropdownItem>
            <DropdownItem href="">Действие</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardHeader>
      <CardBody>
        <div dir="ltr">
          <ReactApexChart height={250} options={chartOptions} series={chartOptions.series} type="donut" className="apex-charts" />
        </div>
        <div className="table-responsive mb-n1 mt-2">
          <Table borderless size="sm" className="table-nowrap table-centered mb-0">
            <thead className="bg-light bg-opacity-50 thead-sm">
              <tr>
                <th className="py-1">Категория</th>
                <th className="py-1">Заказы</th>
                <th className="py-1">%</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Продукты</td>
                <td>187,232</td>
                <td>
                  48.63%&nbsp;
                  <span className="badge badge-soft-success ms-1">+2.5%</span>
                </td>
              </tr>
              <tr>
                <td>Электроника</td>
                <td>126,874</td>
                <td>
                  36.08%&nbsp;
                  <span className="badge badge-soft-success ms-1">+8.5%</span>
                </td>
              </tr>
              <tr>
                <td>Другое</td>
                <td>90,127</td>
                <td>
                  23.41%&nbsp;
                  <span className="badge badge-soft-danger ms-1">-10.98%</span>
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      </CardBody>
    </Card>
  )
}

export default SalesByCategory
