import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, Bell, User, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { View, TouchableOpacity, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { useLanguage } from '@/contexts/LanguageContext';

function FloatingTabBar({ state, descriptors, navigation }: any) {
	const { t } = useLanguage();
	
	// Map route names to translation keys
	const getTabLabel = (routeName: string) => {
		switch (routeName) {
			case 'feed': return t('nav.home');
			case 'discover': return t('nav.search');
			case 'notifications': return t('nav.alerts');
			case 'profile': return t('nav.profile');
			default: return routeName;
		}
	};
	
	return (
		<BlurView
			intensity={40}
			tint="light"
			style={{
				position: 'absolute',
				left: 16,
				right: 16,
				bottom: 12,
				borderRadius: 28,
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'space-between',
				paddingHorizontal: 10,
				height: 60,
				backgroundColor: 'rgba(255,255,255,0.6)',
				borderWidth: 1,
				borderColor: 'rgba(227,235,233,0.8)',
				// shadow for hovering effect
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 8 },
				shadowOpacity: 0.15,
				shadowRadius: 16,
				elevation: 10,
			}}
		>
			{state.routes.map((route: any, index: number) => {
				const { options } = descriptors[route.key];
				const label = getTabLabel(route.name);

				const isFocused = state.index === index;

				const onPress = () => {
					const event = navigation.emit({
						type: 'tabPress',
						target: route.key,
						canPreventDefault: true,
					});

					if (!isFocused && !event.defaultPrevented) {
						navigation.navigate(route.name);
					}
				};

				const Icon = options.tabBarIcon as any;

				return (
					<TouchableOpacity
						key={route.key}
						accessibilityRole="button"
						onPress={onPress}
						activeOpacity={0.9}
						style={{
							flex: 1,
							alignItems: 'center',
							justifyContent: 'center',
							gap: 2,
						}}
					>
						{Icon ? (
							<Icon color={isFocused ? Colors.primary : Colors.text.secondary} size={22} />
						) : null}
						<Text style={{ color: isFocused ? Colors.primary : Colors.text.secondary, fontWeight: '700' as const, fontSize: 12 }}>
							{label}
						</Text>
					</TouchableOpacity>
				);
			})}

			<TouchableOpacity
				activeOpacity={0.9}
				onPress={() => navigation.navigate('ask-ruvo' as never)}
				style={{
					position: 'absolute',
					right: -8,
					bottom: 10,
					width: 56,
					height: 56,
					borderRadius: 28,
					backgroundColor: Colors.primary,
					alignItems: 'center',
					justifyContent: 'center',
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 8 },
					shadowOpacity: 0.24,
					shadowRadius: 16,
					elevation: 10,
				}}
			>
				<MessageCircle size={24} color={Colors.text.inverse} />
			</TouchableOpacity>
		</BlurView>
	);
}

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors.primary,
				tabBarInactiveTintColor: Colors.text.secondary,
				headerShown: false,
				// hide default style; we render a custom bar
				tabBarStyle: { display: 'none' },
			}}
			tabBar={(props: any) => <FloatingTabBar {...props} />}
		>
			<Tabs.Screen
				name="feed"
				options={{
					tabBarIcon: ({ color, size }: { color: string; size: number }) => (
						<Home color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="discover"
				options={{
					tabBarIcon: ({ color, size }: { color: string; size: number }) => (
						<Search color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="notifications"
				options={{
					tabBarIcon: ({ color, size }: { color: string; size: number }) => (
						<Bell color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					tabBarIcon: ({ color, size }: { color: string; size: number }) => (
						<User color={color} size={size} />
					),
				}}
			/>
		</Tabs>
	);
}
