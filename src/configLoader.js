import axios from 'axios'

export default async function loadConfig() {
  try {
    const response = await axios.get('https://api.openalex.org/entities/config')
    return response.data
  } catch (error) {
    console.error('Failed to load configuration:', error)
    throw error
  }
}