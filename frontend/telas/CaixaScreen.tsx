import React from 'react';

import {
    StatusBar,
    Text,
    View,
    ScrollView,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function CaixaScreen() {

    return (
        <SafeAreaView
            className="flex-1 bg-[#97c9f0]"
            edges={['top']}
        >

            <StatusBar
                backgroundColor="#0876C9"
                barStyle="light-content"
            />

            {/*Cabeçalho*/}
            <View className="bg-[#0876C9] px-4 pt-3 pb-4">
                <View className="flex-row items-center justify-between">
                    <Text className="text-white text-xl font-extrabold italic">
                        ✦ CAIXA
                        <Text className="text-yellow-400">Tem</Text>
                    </Text>

                    <View className="flex-row items-center">
                        <Text className="text-white text-2xl mr-5">
                            ⌕
                        </Text>

                        <Text className="text-white text-2xl">
                            ⋮
                        </Text>

                        <View className="flex-row mt-4 bg-[#168ED2] rounded-md p-3">
                            <View className="flex-1 items-center">
                                <Text className="text-white font-semibold text-sm">
                                    ◉ Mostrar Saldo
                                </Text>
                            </View>

                            <View className="flex-1 items-center">
                                <Text className="text-white font-semibold text-sm">
                                    ◉ Mostrar Contas
                                </Text>
                            </View>
                        </View>

                    </View>

                </View>
            </View>

            {/*Conteúdo na tela*/}
            <ScrollView className="flex-1 bg- [#F5F5F5]">
                <View className="mt-3 bg-white">
                    <View className="flex-row items-center border-b border-gray-200 px-3 py-3">
                        {/*Ícone do Serviço*/}
                        <View className="mr-3 h-11 items-center justify-center rounded-full bg-blue-100">
                            <Text className="text-xl">💰</Text>
                        </View>
                        {/*Informações*/}
                        <View className="flex-1">
                            <Text className="text-sm font-bold text-gray-800">
                                Auxílio emergencial
                            </Text>
                            <Text className="text-xs text-gray-800">
                                Consulte seu benefício
                            </Text>
                        </View>

                        {/*Horário*/}
                        <View className="items-end">
                            <Text className="text -[10px] text-gray-400">
                                21h30
                            </Text>
                            <Text className="mt-1 text-gray-400">
                                ⌖
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="mt-3 bg-white">
                    <View className="flex-row items-center border-b border-gray-200 px-3 py-3">
                        <View className="mr-3 h-11 items-center justify-center rounded-full bg-blue-100">
                            <Text className="text-xl">💸</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-sm font-bold text-gray-800">
                                Transferir Dinheiro
                            </Text>
                            <Text className="text-xs text-gray-800">
                                Transfira seu dinheiro para qualquer banco
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="text -[10px] text-gray-400">
                                21h39
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="mt-3 bg-white">
                    <View className="flex-row items-center border-b border-gray-200 px-3 py-3">
                        <View className="mr-3 h-11 items-center justify-center rounded-full bg-blue-100">
                            <Text className="text-xl">📄</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-sm font-bold text-gray-800">
                                Extrato
                            </Text>
                            <Text className="text-xs text-gray-800">
                                Consulte seu extrato
                            </Text>
                            <View className="items-end">
                                <Text className="text -[10px] text-gray-400">
                                    21h44
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View className="mt-3 bg-white">
                        <View className="flex-row items-center border-b border-gray-200 px-3 py-3">
                            <View className="mr-3 h-11 items-center justify-center rounded-full bg-blue-100">
                                <Text className></Text>
                            </View>
                        </View>
                    </View>

                </View>
            </ScrollView>

        </SafeAreaView>
    )

}