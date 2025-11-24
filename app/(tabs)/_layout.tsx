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
import { Home, Search, Bell, User, Sparkles, Users } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { BlurView } from 'expo-blur';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';

function FloatingTabBar({ state, descriptors, navigation }: any) {
	const { t } = useLanguage();
	const { notifications } = useApp();
	const { colors, mode } = useTheme();
	
	// Map route names to translation keys
	const getTabLabel = (routeName: string) => {
		switch (routeName) {
			case 'feed': return t('nav.home');
			case 'discover': return t('nav.search');
			case 'community': return t('nav.community');
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
					paddingHorizontal: 12,
					height: 64,
					backgroundColor: colors.background.white,
					borderWidth: 1,
					borderColor: colors.border.lighter,
					// Enhanced shadow for better depth
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: Platform.OS === 'web' ? 4 : 12 },
                    shadowOpacity: Platform.OS === 'web' ? 0.12 : 0.2,
                    shadowRadius: Platform.OS === 'web' ? 12 : 24,
                    elevation: Platform.OS === 'web' ? 6 : 12,
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
						case 'community':
							IconComponent = Users;
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
							activeOpacity={0.8}
							style={{
								flex: 1,
								alignItems: 'center',
								justifyContent: 'center',
								gap: 4,
								paddingVertical: 8,
								borderRadius: 20,
								backgroundColor: isFocused ? colors.background.light : 'transparent',
							}}
						>
							<IconComponent 
								color={isFocused ? colors.primary : colors.text.secondary} 
								size={24} 
							/>
                            <Text style={{ 
								color: isFocused ? colors.primary : colors.text.secondary, 
                                fontWeight: isFocused ? '700' : '500', 
                                fontSize: 11,
                                lineHeight: 14,
                            }}>
								{label}
							</Text>
							{route.name === 'notifications' && notificationCount > 0 && (
								<View style={{
									position: 'absolute',
									top: 2,
									right: 12,
									backgroundColor: colors.alert,
									borderRadius: 12,
									minWidth: 20,
									height: 20,
									alignItems: 'center',
									justifyContent: 'center',
									paddingHorizontal: 4,
									// Add shadow for better visibility
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.2,
									shadowRadius: 4,
									elevation: 3,
								}}>
									<Text style={{ 
										color: 'white', 
										fontSize: 11, 
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
			
			{/* Enhanced floating button implementation */}
			<TouchableOpacity
				activeOpacity={0.9}
				onPress={() => navigation.navigate('ask-ruvo' as never)}
				style={{
					position: 'absolute',
					right: 24,
					bottom: 96,
					width: 60,
					height: 60,
					borderRadius: 30,
					backgroundColor: colors.primary,
					alignItems: 'center',
					justifyContent: 'center',
					// Enhanced shadow for better depth
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 12 },
					shadowOpacity: 0.3,
					shadowRadius: 24,
					elevation: 15,
					zIndex: 9999,
					// Add border for better definition
					borderWidth: 2,
					borderColor: 'rgba(255,255,255,0.2)',
				}}
			>
				<Image 
					source={require('@/assets/images/icon.png')} 
					style={{ width: 36, height: 36 }}
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
				name="community"
				options={{
					tabBarLabel: 'Community',
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