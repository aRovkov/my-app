// @flow

import * as React from 'react';
import {useState, useLayoutEffect, useRef, useContext} from 'react';
import './slider.scss';
import preloadImage from '../scripts/preloadImage.js'
import ShaftDefaultImg from './styleDefault/shaft.png';
import ArrowDefaultImg from './styleDefault/arrow.png';


export const SliderContext = React.createContext();

type Props = {
	name: string,
	getValue: (slider: string, value: number) => void,
	scale: Array<number | string>,
	step?: number,
	shaft?: string,
	arrow?: string,
	width?: number | string,
	height?: number | string,
	padding?: number | string,
	positionScale: 'up' | 'done' | 'none'
}

export default function Slider(props) {
	const dispatchValue = props.getValue;
	let workScale;	// отступ и размер рабочей области шкалы
	let scaleItems;	// значения шкалы
	let rangeItemsRef = useRef();	// значения по которым проходит стрелка (если все значения числовые) исходя из шага step
	let step;
	const sliderContext = useContext(SliderContext);	// {shaftImage, arrowImage, width, height}
	const {
			shaftImage: contextShaft = undefined, 
			arrowImage: contextArrow = undefined,
			width: contextWidth = undefined,
			height: contextHeight = undefined
	} = (typeof sliderContext === 'object') ? sliderContext : {};
	
	const [position, setPosition] = useState(0);
	
	step = parseFloat(props.step) || 1;
	const positionScale = props.positionScale || 'up';
	const wrapRef = useRef();
	let wrap, scale, shaft, arrow;
	
	useLayoutEffect(() => {
		wrap = wrapRef.current;
		scale = wrap.querySelector('.scale');
		shaft = wrap.querySelector('.shaft');
		arrow = wrap.querySelector('.arrow');

		async function buildScale(){
			try {
				await preloadImage(shaft.querySelector('img'));
				await preloadImage(arrow.querySelector('img'));
				
				workScale = workScaleMeasuring(scale.offsetWidth, props.padding || '5%');
				
				// return [scaleItems, rangeItems]
				const itemsOfScaleAndRange = scalePosition(scale, props.scale, workScale[0], step);
				scaleItems = itemsOfScaleAndRange[0];
				rangeItemsRef.current = itemsOfScaleAndRange[1];

				setArrow(scaleItems[0][0]);
			} catch (e) {
				console.log('Slider.buildScale:', e.message, e.stack);
			}
		};

		buildScale();
	});

	let prevCoordCurX = useRef();

	function arrowMDHandle(e) {
		e.preventDefault();
		prevCoordCurX.current = e.clientX;

		document.addEventListener('mouseup', arrowMUHandle);
		document.addEventListener('mousemove', wrapMMHandle);
	}
	
	function arrowMUHandle(e) {
		document.removeEventListener('mouseup', arrowMUHandle);
		document.removeEventListener('mousemove', wrapMMHandle);
	}

	const currentRangeXRef = useRef();

	function wrapMMHandle(e) {
		const rangeItems = rangeItemsRef.current;
		let currentRangeX = currentRangeXRef.current;

		if (!currentRangeX) currentRangeX = [rangeItems[0][0], rangeItems[1][0]];
		const  coordCurX = e.clientX - wrap.getBoundingClientRect().x;
		
		// когда двигаемся в текущем диапазоне незачем обрабатывать событие
		if (coordCurX >= currentRangeX[0] && coordCurX < currentRangeX[1]) return;
		
		// определяем направление движения мыши
		const directionForward = (coordCurX >= prevCoordCurX.current) ? true : false; 
		prevCoordCurX.current = coordCurX;
		
		setArrow(coordCurX, directionForward);
	}

	function sliderClickHandle(e) {
		const coordCurX = e.clientX;

		setArrow(coordCurX, 'click');
		
		arrow.focus();
	}

	function arrowKDHandle(e) {
		let currentRangeX = currentRangeXRef.current;
		const currentX = currentRangeX[0];
		let nextX;
		const rangeItems = rangeItemsRef.current;
		const currentPositionInRanges = rangeItems.findIndex(e => e[0] === currentX);

		switch (e.keyCode) {
			case 39: 
				if (!rangeItems[currentPositionInRanges+1]) return;
				nextX = rangeItems[currentPositionInRanges+1][0];
				break; 
			case 37: 
				if (!rangeItems[currentPositionInRanges-1]) return;
				nextX = rangeItems[currentPositionInRanges-1][0];
				break; 
			default:
				return;
		}

		setArrow(nextX);
	}

	function setArrow(coordCurX, directionForward = true) {
		const rangeItems = rangeItemsRef.current;
		
		// определяем позицию стрелки и значение на которое оно указывает, а также координаты нового диапазона на оси, в котором находится указатель мыши
		const [currentPositionAndValue, currentRangeX] = defineArrowPosition(coordCurX, rangeItems, directionForward);
		currentRangeXRef.current = currentRangeX;

		// устанавливаем стрелку в новое положение
		setPosition(currentPositionAndValue[0] - arrow.offsetWidth/2);

		// передаем значение
		dispatchValue(props.name, currentPositionAndValue[1]);
	}
	
	return (
		<div className="wrapSlider" ref={wrapRef} style={{width: props.width || contextWidth || '100%'}}>
			{positionScale==='up' && <div className="scale"></div>}
			{positionScale==='none' && <div className="scale" style={{visibility: 'hidden', height: '0'}}></div>}
			
			<div className="slider" onClick={sliderClickHandle} style={{height: props.height || contextHeight || '100px'}}>
				<div className="shaft">
					<img src={props.shaft || contextShaft || ShaftDefaultImg} alt="Ось слайдера"/>
				</div>
				<div className="arrow" onMouseDown={arrowMDHandle} onKeyDown={arrowKDHandle} style={{left: position}} tabIndex={9999}>
					<img src={props.arrow || contextArrow || ArrowDefaultImg} alt="Указатель слайдера"/>
				</div>
			</div>
			
			{positionScale==='down' && <div className="scale"></div>}
		</div>
	);
}

function workScaleMeasuring(width, padding) {
	if (!padding) {
		padding = width * 5 / 100; 
		return [padding, width - padding*2];
	}

	padding = padding.match(/(\d*)([^0-9]*)/i);

	if (padding[2] === '%') {
		padding = padding[1] * width / 100;
		return [padding, width - padding*2];
	}
	
	if (padding[2] === 'px') {
		padding = padding[1];
		return [padding, width - padding*2];
	}
}

function scalePosition(scale, scaleItemsValues, padding, step) {
	let scaleItems, rangeItems;
	let isNumbers;	// все значения числовые - true

	if (!scaleItemsValues) return;

	scale.style.padding = `0 ${+padding}px`;
	
	scaleItemsValues.forEach((e, i) => {
		const sri = document.createElement('div');
		sri.className = 'scaleItem';
		sri.setAttribute('key', `range-${e}`);
		sri.innerHTML = e;
		scale.append(sri);
	});

	const scaleX = scale.getBoundingClientRect().x;
	scaleItems = Array.from(scale.querySelectorAll('.scaleItem'), 
							e => [e.getBoundingClientRect().x + e.offsetWidth/2 - scaleX, e.innerHTML]);

	isNumbers = scaleItems.every(e => {
		return /(\d+?).*/.test(e[1]) || /(\d+?)[.,](\d*?).*/.test(e[1]);
	});
	
	if (isNumbers) {
		scaleItems = scaleItems.map(e => [e[0], parseFloat(e[1])]);
		rangeItems = scaleItems.reduce((newArr, e, i, arr) => {
			if (!arr[i+1]) return newArr.concat([[e[0], e[1]]]);
			
			// диапозон [координат, числовых значений], которые добавляются в градацию текущего диапозона
			const steps = [(arr[i+1][0] - arr[i][0]) / step, (arr[i+1][1] - arr[i][1]) / step];
			let addArr = [];
			for (let j=0; j<step; j++) {
				addArr.push([e[0] + steps[0] * j, e[1] + steps[1] * j]);
			}
			
			return newArr.concat(addArr);
		}, []);
	} else {
		rangeItems = scaleItems;
	}
	
	return [scaleItems, rangeItems];
}

function defineArrowPosition(coordCurX, rangeItems, directionForward) {
	let i=0;
	const firstRange = rangeItems[0];
	const lastRange = rangeItems[rangeItems.length - 1];
	
	// return [currentPositionAndValue, currentRangeX]
	for (const e of rangeItems) {
		let controlRange = rangeItems[i];
		let prevControlRange = rangeItems[i-1];

		if (coordCurX < firstRange[0]) {
			return [firstRange, [firstRange[0], rangeItems[1][0]]];
		} else if (coordCurX >= lastRange[0]) {
			return [lastRange, [lastRange[0], lastRange[0]]];
		} else if (directionForward === 'click' && coordCurX < e[0]) {
			const middleRange = ((controlRange[0] - prevControlRange[0]) / 2) + prevControlRange[0];
			
			return (
				(coordCurX < middleRange) 
					? [prevControlRange, [prevControlRange[0], controlRange[0]]] 
					: [controlRange, [controlRange[0], controlRange[0]]]	
			);
		} else if (directionForward !== 'click' && coordCurX < e[0]) {
			return [
				(directionForward) ? prevControlRange : controlRange,
				[prevControlRange[0], controlRange[0]]
			];
		}
		i++;
	}
}
