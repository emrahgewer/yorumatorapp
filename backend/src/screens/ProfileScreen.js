import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const ProfileScreen = ({ route }) => {
  const navigation = useNavigation();
  const { currentUser, userToken, logout } = useAuth();
  const userId = route?.params?.userId || currentUser?.id;
  const isOwnProfile = !route?.params?.userId || route?.params?.userId === currentUser?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const headers = {};
      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }

      const response = await axios.get(
        `${API_BASE_URL}/users/${userId}/profile`,
        { headers }
      );
      setProfile(response.data);
      setFollowing(response.data.is_following || false);
    } catch (error) {
      console.error('Profile fetch error:', error);
      Alert.alert('Hata', 'Profil yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!userToken) {
      Alert.alert('Giriş Gerekli', 'Takip etmek için giriş yapmalısınız.');
      return;
    }

    try {
      setFollowLoading(true);
      if (following) {
        await axios.delete(
          `${API_BASE_URL}/users/${userId}/follow`,
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        setFollowing(false);
        if (profile) {
          setProfile({ ...profile, follower_count: profile.follower_count - 1 });
        }
      } else {
        await axios.post(
          `${API_BASE_URL}/users/${userId}/follow`,
          {},
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        setFollowing(true);
        if (profile) {
          setProfile({ ...profile, follower_count: profile.follower_count + 1 });
        }
      }
    } catch (error) {
      console.error('Follow error:', error);
      Alert.alert('Hata', error.response?.data?.detail || 'Takip işlemi başarısız');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Profil yükleniyor...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Profil bulunamadı</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile.full_name || profile.email}</Text>
        <Text style={styles.email}>{profile.email}</Text>

        {!isOwnProfile && (
          <TouchableOpacity
            style={[styles.followButton, following && styles.followingButton]}
            onPress={handleFollow}
            disabled={followLoading}
            activeOpacity={0.7}
          >
            {followLoading ? (
              <ActivityIndicator color={following ? '#007AFF' : '#FFFFFF'} size="small" />
            ) : (
              <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
                {following ? 'Takip Ediliyor' : 'Takip Et'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.follower_count || 0}</Text>
            <Text style={styles.statLabel}>Takipçi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.following_count || 0}</Text>
            <Text style={styles.statLabel}>Takip</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.review_count || 0}</Text>
            <Text style={styles.statLabel}>Yorum</Text>
          </View>
        </View>
      </View>

      {isOwnProfile && (
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            Alert.alert(
              'Çıkış Yap',
              'Çıkış yapmak istediğinize emin misiniz?',
              [
                { text: 'İptal', style: 'cancel' },
                {
                  text: 'Çıkış Yap',
                  style: 'destructive',
                  onPress: async () => {
                    await logout();
                  },
                },
              ]
            );
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 18,
    color: '#DC2626',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  followingButton: {
    backgroundColor: '#E5E7EB',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  followingButtonText: {
    color: '#007AFF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;

