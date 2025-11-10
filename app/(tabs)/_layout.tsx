import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  Platform,
} from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Search, Bell, User, Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { BlurView } from 'expo-blur';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';

function FloatingTabBar({ state, descriptors, navigation }: any) {
	const { t } = useLanguage();
	const { notifications } = useApp();
	const { colors } = useTheme();
	
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
	
	// Get notification count for alerts tab
	const notificationCount = notifications.filter(n => !n.read).length;
	
	return (
		<View pointerEvents="box-none">
            <View
				style={{
					position: 'absolute',
					left: 16,
					right: 16,
					bottom: 20,
					borderRadius: 28,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					paddingHorizontal: 10,
					height: 60,
					backgroundColor: colors.background.white,
					borderWidth: 1,
					borderColor: colors.border.lighter,
					// shadow for hovering effect
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: Platform.OS === 'web' ? 4 : 8 },
                    shadowOpacity: Platform.OS === 'web' ? 0.08 : 0.15,
                    shadowRadius: Platform.OS === 'web' ? 8 : 16,
                    elevation: Platform.OS === 'web' ? 4 : 10,
					zIndex: 1000,
				}}
			>
				{state.routes.map((route: any, index: number) => {
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

					// Define icons directly instead of using the options
					let IconComponent;
					switch (route.name) {
						case 'feed':
							IconComponent = Home;
							break;
						case 'discover':
							IconComponent = Search;
							break;
						case 'notifications':
							IconComponent = Bell;
							break;
						case 'profile':
							IconComponent = User;
							break;
						default:
							IconComponent = Home;
					}

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
							<IconComponent 
								color={isFocused ? colors.primary : colors.text.secondary} 
								size={22} 
							/>
                            <Text style={{ 
								color: isFocused ? colors.primary : colors.text.secondary, 
                                fontWeight: '700', 
                                fontSize: 12,
                            }}>
								{label}
							</Text>
							{route.name === 'notifications' && notificationCount > 0 && (
								<View style={{
									position: 'absolute',
									top: -2,
									right: 10,
									backgroundColor: colors.alert,
									borderRadius: 10,
									width: 20,
									height: 20,
									alignItems: 'center',
									justifyContent: 'center',
								}}>
									<Text style={{ 
										color: 'white', 
										fontSize: 10, 
										fontWeight: 'bold' 
									}}>
										{notificationCount > 9 ? '9+' : notificationCount}
									</Text>
								</View>
							)}
						</TouchableOpacity>
					);
				})}
			</View>
			
			{/* Simple floating button implementation */}
			<TouchableOpacity
				activeOpacity={0.9}
				onPress={() => navigation.navigate('ask-ruvo' as never)}
				style={{
					position: 'absolute',
					right: 20,
					bottom: 90,
					width: 56,
					height: 56,
					borderRadius: 28,
					backgroundColor: colors.primary,
					alignItems: 'center',
					justifyContent: 'center',
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 8 },
					shadowOpacity: 0.24,
					shadowRadius: 16,
					elevation: 10,
					zIndex: 9999,
				}}
			>
				<Image 
					source={require('@/assets/images/icon.png')} 
					style={{ width: 40, height: 40 }}
					resizeMode="contain"
				/>
			</TouchableOpacity>
		</View>
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
					tabBarLabel: 'Home',
				}}
			/>
			<Tabs.Screen
				name="discover"
				options={{
					tabBarLabel: 'Discover',
				}}
			/>
			<Tabs.Screen
				name="notifications"
				options={{
					tabBarLabel: 'Notifications',
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					tabBarLabel: 'Profile',
				}}
			/>
		</Tabs>
	);
}