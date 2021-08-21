// import logo from './logo.svg';
import {useState} from 'react';
import './App.css';
import Slider, {SliderContext} from './slider/slider.jsx';
import Shaft from './slider/styleOther/shaft.png';
import Arrow from './slider/styleOther/arrow.png';

function App() {
  const [sliderValue, setSliderValue] = useState({});
  
  
  function getSliderValue(slider, value) {
    setSliderValue(sliderValue => ({...sliderValue, [slider]: value}));
  }

  return (
    <div className="App">
      <SliderContext.Provider value={{height: 50, width:500}}>
        <div style={{padding: '20px 0 10px'}}>Значение слайдера: {sliderValue.slider1}</div>
        <Slider name='slider1' getValue={getSliderValue} scale={[0, '5', '10', 15, 20]} step={5}/>
        
        <div style={{padding: '20px 0 10px'}}>Значение слайдера: {sliderValue.slider2}</div>
        <Slider name='slider2' getValue={getSliderValue} scale={[0, 100, 200, 300]} step={100} shaft={Shaft} arrow={Arrow} height={20} padding="25%"/>
        
        <div style={{padding: '20px 0 10px'}}>Значение слайдера: {sliderValue.slider3}</div>
        <Slider name='slider3' getValue={getSliderValue} scale={['sun', 'moon', 'earth']} step={100}/>
      </SliderContext.Provider>
    </div>
  );
}

export default App;
