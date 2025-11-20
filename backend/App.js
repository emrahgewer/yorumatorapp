import React from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import ProductsScreen from './src/screens/ProductsScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import CategoryMenuScreen from './src/screens/CategoryMenuScreen';
import ProductSubmitScreen from './src/screens/ProductSubmitScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Giriş Yap' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Kayıt Ol' }}
      />
    </Stack.Navigator>
  );
};

const AppStack = () => {
  const { currentUser } = useAuth();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackVisible: true,
        headerBackTitle: 'Geri',
      }}
    >
      <Stack.Screen
        name="Products"
        component={ProductsScreen}
        options={({ navigation, route }) => ({
          title: route.params?.category_name || 'Ürünler',
          headerBackVisible: false,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                style={{ padding: 8 }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#fff', fontSize: 20 }}>🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile', { userId: currentUser?.id })}
                style={{ padding: 8 }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#fff', fontSize: 20 }}>👤</Text>
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ navigation }) => ({
          title: 'Ürün Detayı',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Products', {})}
              style={{ marginRight: 16, padding: 8 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>🏠 Ana Sayfa</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="CategoryMenu"
        component={CategoryMenuScreen}
        options={({ navigation }) => ({
          title: 'Kategoriler',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Products', {})}
              style={{ marginRight: 16, padding: 8 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>🏠 Ana Sayfa</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="ProductSubmit"
        component={ProductSubmitScreen}
        options={({ navigation }) => ({
          title: 'Ürün Ekle',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Products', {})}
              style={{ marginRight: 16, padding: 8 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>🏠 Ana Sayfa</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={({ navigation, route }) => ({
          title: route.params?.userId ? 'Profil' : 'Profilim',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Products', {})}
              style={{ marginRight: 16, padding: 8 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>🏠 Ana Sayfa</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={({ navigation }) => ({
          title: 'Favorilerim',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Products', {})}
              style={{ marginRight: 16, padding: 8 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>🏠 Ana Sayfa</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={({ navigation }) => ({
          title: 'Bildirimler',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Products', {})}
              style={{ marginRight: 16, padding: 8 }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>🏠 Ana Sayfa</Text>
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});

