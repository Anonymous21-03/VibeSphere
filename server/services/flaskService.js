import axios from 'axios';
import FormData from 'form-data';

const FLASK_BASE_URL = 'http://127.0.0.1:5001'; // Adjust port if Flask uses a different one

/**
 * Send a file (image or video) to the Flask backend for analysis.
 * @param {string} endpoint - Flask API endpoint.
 * @param {Buffer} fileBuffer - File data in buffer format.
 * @param {string} filename - File name.
 * @param {string} fileType - MIME type of the file.
 * @returns {Object} - Flask API response.
 */
export const sendFileToFlask = async (endpoint, fileBuffer, filename, fileType) => {
    try {
        const formData = new FormData();
        formData.append('file', fileBuffer, { filename, contentType: fileType });

        const response = await axios.post(`${FLASK_BASE_URL}/${endpoint}`, formData, {
            headers: formData.getHeaders(),
        });
        return response.data;
    } catch (error) {
        console.error(`Error communicating with Flask (${endpoint}):`, error.message);
        throw new Error(error.response?.data || 'Error communicating with Flask');
    }
};

/**
 * Send JSON data to the Flask backend for processing.
 * @param {string} endpoint - Flask API endpoint.
 * @param {Object} jsonData - JSON payload.
 * @returns {Object} - Flask API response.
 */
export const sendJsonToFlask = async (endpoint, jsonData) => {
    try {
        const response = await axios.post(`${FLASK_BASE_URL}/${endpoint}`, jsonData);
        return response.data;
    } catch (error) {
        console.error(`Error communicating with Flask (${endpoint}):`, error.message);
        throw new Error(error.response?.data || 'Error communicating with Flask');
    }
};
