import { useQuery } from '@tanstack/react-query';
import React, { FC } from 'react';
import { FlatList, SafeAreaView, Text, View } from 'react-native';

type Country = {
  name: { common: string; official: string };
  cca2: string;
  cca3: string;
};

const App: FC = () => {
  const url = 'https://restcountries.com/v3.1/all';
  const {
    isPending,
    error,
    data: countries = [],
  } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: () => fetch(url).then((res) => res.json()),
  });

  if (isPending) return <></>;

  if (error) return <></>;

  countries.sort((a, b) => (a.name.common > b.name.common ? 1 : -1));

  return (
    <SafeAreaView className="flex flex-1">
      <View className="border-b p-4 md:p-8">
        <Text>Countries ({countries.length})</Text>
      </View>
      <FlatList
        data={countries}
        renderItem={({ item }) => (
          <View className="border-b p-4 md:p-8">
            <Text>{item.name.common}</Text>
          </View>
        )}
        keyExtractor={(item) => item.cca3}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
};

export default App;
