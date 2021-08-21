export default function preloadImage(img) {
	if (!img || !img.matches('img')) {
		throw new Error('Это не изображение')
	} else {
		return new Promise((resolve, reject) => {
				img.onload = () => resolve(img);
				img.onerror = () => {
					reject(new Error(`Изображение ${img.src} не удалось загрузить`));
				}
			});
	}
}