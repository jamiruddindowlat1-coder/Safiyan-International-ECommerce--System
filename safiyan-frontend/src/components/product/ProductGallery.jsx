export default function ProductGallery({ imageUrl, name }) {
	return <img src={imageUrl || '/sies_logo.svg'} alt={name} style={{ width: '100%', height: 360, objectFit: 'contain', background: '#f8fafc' }} />;
}
