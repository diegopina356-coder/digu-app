import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Oculta la barra de arriba
        tabBarStyle: { display: 'none' }, // OCULTA LA BARRA DE ABAJO
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Evita que aparezca en menús
        }}
      />
    </Tabs>
  );
}