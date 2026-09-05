import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { COLORS } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <NativeTabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
      }}
    >
      <NativeTabs.Trigger name="(home)">
        <Icon sf="pawprint.fill" />
        <Label>My Pets</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="identify">
        <Icon sf="camera.fill" />
        <Label>Identify</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wellness">
        <Icon sf="heart.fill" />
        <Label>Wellness</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="schedule">
        <Icon sf="calendar" />
        <Label>Schedule</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="map">
        <Icon sf="map.fill" />
        <Label>Map</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="breeders">
        <Icon sf="heart.circle.fill" />
        <Label>Breeders</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
