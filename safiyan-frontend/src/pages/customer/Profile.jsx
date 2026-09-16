import { useAuth } from '../../context/AuthContext';

export default function Profile() {
	const { user, logout } = useAuth();
	return <section><h1 style={{ color: '#0f4c81' }}>Profile</h1><p>{user?.fullName}</p><p>{user?.email}</p><p>{user?.phone}</p><button onClick={logout}>Sign out</button></section>;
}
