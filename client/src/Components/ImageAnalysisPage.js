import React, { useState } from 'react';
import './styles/ImageAnalysisPage.css'; // Updated import path
import axios from 'axios';

const ImageAnalysisPage = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);

  const handleImageUpload = (e) => {
    setImage(e.target.files[0]);  // Store the file object
  };

  // const handleAnalyze = async () => {
  //   if (!image) {
  //     alert('Please upload an image first');
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append('file', image);

  //   try {
  //     const response = await fetch('http://localhost:5000/analyze', {
  //       method: 'POST',
  //       body: formData,
  //     });

  //     const data = await response.json();
  //     if (response.ok) {
  //       setResult(data.result);
  //     } else {
  //       setResult(`Error: ${data.error}`);
  //     }
  //   } catch (error) {
  //     console.error('Error:', error);
  //     setResult('Error: Failed to analyze image');
  //   }
  // };
  const handleAnalyze = async () => {
    if (!image) {
      alert('Please upload an image first');
      return;
    }
  
    const formData = new FormData();
    formData.append('file', image);
  
    try {
      const response = await axios.post('http://localhost:8000/ml/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data.result);
    } catch (error) {
      console.error('Error:', error);
      setResult('Error: Failed to analyze image');
    }
  };
  


  return (
    <div className="image-analysis-page">
      <h2>Image Emotion Analysis</h2>
      <div className="upload-section">
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <button onClick={handleAnalyze}>Analyze Image</button>
      </div>
      {image && <img src={URL.createObjectURL(image)} alt="Uploaded" className="uploaded-image" />}
      {result && <div className="result">Analysis Result: {result}</div>}
    </div>
  );
}

export default ImageAnalysisPage;
