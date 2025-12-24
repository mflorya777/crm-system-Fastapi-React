import type { ApexOptions } from 'apexcharts'
import ReactApexChart from 'react-apexcharts'
import { Button, Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'

const RevenueChart = () => {
  const chartOptions: ApexOptions = {
    series: [
      {
        name: 'Доход',
        type: 'area',
        data: [34, 65, 46, 68, 49, 61, 42, 44, 78, 52, 63, 67],
      },
      {
        name: 'Расходы',
        type: 'line',
        data: [8, 12, 7, 17, 21, 11, 5, 9, 7, 29, 12, 35],
      },
    ],
    chart: {
      height: 280,
      type: 'line',
      toolbar: {
        show: false,
      },
    },
    stroke: {
      dashArray: [0, 8],
      width: [2, 2],
      curve: 'smooth',
    },
    fill: {
      opacity: [1, 1],
      type: ['gradient', 'solid'],
      gradient: {
        type: 'vertical',
        //   shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 70],
      },
    },
    markers: {
      size: [0, 0, 0],
      strokeWidth: 2,
      hover: {
        size: 4,
      },
    },
    xaxis: {
      categories: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
    },
    yaxis: {
      min: 0,
      tickAmount: 4,
      labels: {
        formatter: function (val) {
          return val + 'k'
        },
        offsetX: -15,
      },
      axisBorder: {
        show: false,
      },
    },
    grid: {
      show: true,
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: -10,
        right: -2,
        bottom: -10,
        left: -5,
      },
    },
    legend: {
      show: false,
    },
    colors: ['#7f56da', '#22c55e'],
    tooltip: {
      shared: true,
      y: [
        {
          formatter: function (y) {
            if (typeof y !== 'undefined') {
              return '$' + y.toFixed(2) + 'k'
            }
            return y
          },
        },
        {
          formatter: function (y) {
            if (typeof y !== 'undefined') {
              return '$' + y.toFixed(2) + 'k'
            }
            return y
          },
        },
      ],
    },
  }
  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle>Доход</CardTitle>
        <div className="flex-centered gap-1">
          <Button variant="outline-light" size="sm" type="button">
            ВСЕ
          </Button>
          <Button variant="outline-light" size="sm" type="button">
            1М
          </Button>
          <Button variant="outline-light" size="sm" type="button">
            6М
          </Button>
          <Button variant="outline-light" size="sm" type="button" active>
            1Г
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <div dir="ltr">
          <ReactApexChart options={chartOptions} series={chartOptions.series} height={280} type="line" className="apex-charts" />
        </div>
      </CardBody>
    </Card>
  )
}

export default RevenueChart
