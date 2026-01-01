import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Включаем отправку cookies
})

function HttpClient() {
  return {
    get: axiosInstance.get.bind(axiosInstance),
    post: axiosInstance.post.bind(axiosInstance),
    patch: axiosInstance.patch.bind(axiosInstance),
    put: axiosInstance.put.bind(axiosInstance),
    delete: axiosInstance.delete.bind(axiosInstance),
  }
}

export default HttpClient()
