import React from 'react';

import {
    StatusBar,
    Text,
    View,
    ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function CaixaScreen(){

    return (
        <SafeAreaView
            className="flex-1 bg-white"
            edges={['top']}
        >

            <StatusBar 
                backgroundColor="#0876C9"
                barStyle="light-content"
            />

            {/*Cabeçalho*/}
            <View className = "bg-[#0876C9] px-4 pt-3 pb-4">
               <View className = "flex-row items-center justify-between">
                <Text className = "text-white text-xl font-extrabold italic">
                           ✦ CAIXA
                    <Text className = "text-yellow-400">Tem</Text>
                </Text>

                <View className = "flex-row items-center">
                    <Text className = "text-white text-2xl mr-5">
                        ⌕
                    </Text>

                    <Text className = "text-white text-2xl">
                          ⋮
                    </Text>

                <View className = "flex-row mt-4 bg-[#168ED2] rounded-md p-3">
                    <View className = "flex-1 items-center">
                        <Text className = "text-white font-semibold text-sm">
                             ◉ Mostrar Saldo
                        </Text>
                    </View>

                    <View className = "flex-1 items-center">
                        <Text className = "text-white font-semibold text-sm">
                              ◉ Mostrar Contas
                        </Text>
                    </View>
                </View>

                </View>

               </View>
            </View>

            {/*Conteúdo na tela*/}
            <ScrollView className= "flex-1 bg- [#F5F5F5]">

            </ScrollView>

            </SafeAreaView>
        )

}