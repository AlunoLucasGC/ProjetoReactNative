import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Cliente = { id: string; nome?: string };
type Veiculo = { id: string; marca?: string; modelo?: string; ano?: string | number; placa?: string; cor?: string; clienteId?: string };
type FormVeiculo = { marca: string; modelo: string; ano: string; placa: string; cor: string; clienteId: string };

// Android Emulator: use 10.0.2.2. On a physical phone, replace it with your PC's local IPv4.
// Expo Web / browser on the same computer: use http://localhost:3000.
const API_URL = 'http://10.0.2.2:3000';
const FORM_VAZIO: FormVeiculo = { marca: '', modelo: '', ano: '', placa: '', cor: '', clienteId: '' };

function Campo({ label, value, onChangeText, placeholder, keyboardType = 'default' }: {
  label: string; value: string; onChangeText: (value: string) => void; placeholder?: string;
  keyboardType?: 'default' | 'numeric';
}) {
  return <View className="mb-4"><Text className="mb-1.5 text-sm font-semibold text-slate-700">{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder ?? label} placeholderTextColor="#94A3B8" keyboardType={keyboardType} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base text-slate-800" /></View>;
}

export default function VeiculosScreen() {
  const insets = useSafeAreaInsets();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [modal, setModal] = useState<'form' | 'detalhes' | null>(null);
  const [seletorCliente, setSeletorCliente] = useState(false);
  const [selecionado, setSelecionado] = useState<Veiculo | null>(null);
  const [form, setForm] = useState<FormVeiculo>(FORM_VAZIO);

  const carregarDados = useCallback(async (refresh = false) => {
    if (refresh) setAtualizando(true); else setCarregando(true);
    try {
      const [resVeiculos, resClientes] = await Promise.all([fetch(`${API_URL}/veiculos`), fetch(`${API_URL}/clientes`)]);
      const dadosVeiculos = await resVeiculos.json();
      const dadosClientes = await resClientes.json();
      if (!resVeiculos.ok) throw new Error(dadosVeiculos?.erro ?? 'Não foi possível carregar os veículos.');
      if (!resClientes.ok) throw new Error(dadosClientes?.erro ?? 'Não foi possível carregar os clientes.');
      setVeiculos(Array.isArray(dadosVeiculos) ? dadosVeiculos : []);
      setClientes(Array.isArray(dadosClientes) ? dadosClientes : []);
    } catch (erro) {
      Alert.alert('Erro de conexão', erro instanceof Error ? `${erro.message}\n\nConfira se o backend está rodando e se API_URL está correta.` : 'Não foi possível conectar à API.');
    } finally { setCarregando(false); setAtualizando(false); }
  }, []);

  useEffect(() => { void carregarDados(); }, [carregarDados]);
  const nomeCliente = (id?: string) => clientes.find((cliente) => cliente.id === id)?.nome ?? (id ? `Cliente ${id}` : 'Cliente não selecionado');
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return veiculos;
    return veiculos.filter((v) => [v.marca, v.modelo, v.placa, v.cor, nomeCliente(v.clienteId)].some((valor) => (valor ?? '').toLowerCase().includes(termo)));
  }, [veiculos, busca, clientes]);

  function novoVeiculo() {
    if (!clientes.length) { Alert.alert('Cadastre um cliente primeiro', 'A API exige um cliente existente para cadastrar um veículo. Vá até a tela Clientes e cadastre um cliente.'); return; }
    setSelecionado(null); setForm({ ...FORM_VAZIO, clienteId: clientes[0]?.id ?? '' }); setModal('form');
  }
  async function consultarVeiculo(veiculo: Veiculo) {
    try {
      const resposta = await fetch(`${API_URL}/veiculos/${veiculo.id}`); const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados?.erro ?? 'Não foi possível consultar o veículo.');
      setSelecionado(dados); setModal('detalhes');
    } catch (erro) { Alert.alert('Erro', erro instanceof Error ? erro.message : 'Falha ao consultar veículo.'); }
  }
  function editarVeiculo(veiculo: Veiculo) {
    setSelecionado(veiculo);
    setForm({ marca: veiculo.marca ?? '', modelo: veiculo.modelo ?? '', ano: String(veiculo.ano ?? ''), placa: veiculo.placa ?? '', cor: veiculo.cor ?? '', clienteId: veiculo.clienteId ?? '' });
    setModal('form');
  }
  function alterar(campo: keyof FormVeiculo, valor: string) { setForm((atual) => ({ ...atual, [campo]: valor })); }

  async function salvarVeiculo() {
    if (!form.marca.trim() || !form.modelo.trim() || !form.placa.trim() || !form.clienteId) {
      Alert.alert('Campos obrigatórios', 'Preencha marca, modelo, placa e cliente responsável.'); return;
    }
    setSalvando(true);
    try {
      const editando = Boolean(selecionado?.id);
      const resposta = await fetch(editando ? `${API_URL}/veiculos/${selecionado!.id}` : `${API_URL}/veiculos`, {
        method: editando ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ano: form.ano }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados?.erro ?? 'Não foi possível salvar o veículo.');
      setModal(null); await carregarDados(true); Alert.alert('Sucesso', editando ? 'Veículo atualizado.' : 'Veículo cadastrado.');
    } catch (erro) { Alert.alert('Erro', erro instanceof Error ? erro.message : 'Falha ao salvar veículo.'); }
    finally { setSalvando(false); }
  }
  function confirmarExclusao(veiculo: Veiculo) {
    Alert.alert('Excluir veículo?', `Deseja excluir ${veiculo.marca ?? ''} ${veiculo.modelo ?? ''}?`, [
      { text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => { void excluirVeiculo(veiculo); } },
    ]);
  }
  async function excluirVeiculo(veiculo: Veiculo) {
    try {
      const resposta = await fetch(`${API_URL}/veiculos/${veiculo.id}`, { method: 'DELETE' });
      if (!resposta.ok) { const dados = await resposta.json().catch(() => ({})); throw new Error(dados?.erro ?? 'Não foi possível excluir o veículo.'); }
      if (selecionado?.id === veiculo.id) setModal(null);
      await carregarDados(true); Alert.alert('Sucesso', 'Veículo excluído.');
    } catch (erro) { Alert.alert('Erro', erro instanceof Error ? erro.message : 'Falha ao excluir veículo.'); }
  }

  return <View className="flex-1 bg-slate-50">
    <View className="bg-blue-700 px-5 pb-4" style={{ paddingTop: insets.top + 8 }}>
      <Text className="text-sm font-semibold text-blue-100">OFICINAPRO  /  CADASTROS</Text>
      <Text className="mt-2 text-3xl font-extrabold text-white">Veículos</Text>
      <Text className="mt-1 text-sm text-blue-100">Veículos vinculados aos clientes.</Text>
      <View className="mt-3 flex-row items-center rounded-2xl bg-white/15 px-4 py-3"><Text className="mr-2 text-lg text-white">⌕</Text><TextInput value={busca} onChangeText={setBusca} placeholder="Buscar por modelo, marca ou placa" placeholderTextColor="#DBEAFE" className="flex-1 text-sm text-white" /></View>
    </View>
    <View className="-mt-3 flex-1 rounded-t-3xl bg-slate-50 px-4 pt-5">
      <View className="mb-4 flex-row items-center justify-between"><View><Text className="text-lg font-bold text-slate-900">Veículos cadastrados</Text><Text className="mt-1 text-sm text-slate-500">{veiculos.length} registro(s)</Text></View><Pressable onPress={novoVeiculo} className="rounded-xl bg-blue-600 px-4 py-3"><Text className="font-bold text-white">＋ Novo</Text></Pressable></View>
      {carregando ? <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2563EB" /><Text className="mt-3 text-slate-500">Carregando veículos...</Text></View> : <FlatList data={filtrados} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { void carregarDados(true); }} tintColor="#2563EB" />} contentContainerStyle={{ paddingBottom: 28, flexGrow: 1 }} ListEmptyComponent={<View className="flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8"><Text className="text-3xl">🚘</Text><Text className="mt-3 text-lg font-bold text-slate-800">Nenhum veículo encontrado</Text><Text className="mt-1 text-center text-sm text-slate-500">Cadastre um cliente e depois adicione um veículo.</Text></View>} renderItem={({ item }) => <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Pressable onPress={() => { void consultarVeiculo(item); }} className="flex-row items-center"><View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-50"><Text className="text-2xl">🚗</Text></View><View className="ml-3 flex-1"><Text className="text-base font-bold text-slate-900">{item.marca || 'Marca'} {item.modelo || 'Modelo'}</Text><Text className="mt-1 text-sm font-semibold text-blue-700">{item.placa || 'Placa não informada'}{item.ano ? ` • ${item.ano}` : ''}</Text><Text className="mt-1 text-sm text-slate-500">Proprietário: {nomeCliente(item.clienteId)}</Text></View><Text className="text-2xl text-slate-400">›</Text></Pressable>
        <View className="mt-4 flex-row border-t border-slate-100 pt-3"><Pressable onPress={() => editarVeiculo(item)} className="mr-2 flex-1 rounded-xl bg-blue-50 py-2.5"><Text className="text-center font-bold text-blue-700">Editar</Text></Pressable><Pressable onPress={() => confirmarExclusao(item)} className="flex-1 rounded-xl bg-red-50 py-2.5"><Text className="text-center font-bold text-red-600">Excluir</Text></Pressable></View>
      </View>} />}
    </View>

    <Modal visible={modal !== null} animationType="slide" transparent onRequestClose={() => setModal(null)}><View className="flex-1 justify-end bg-slate-950/40"><View className="max-h-[92%] rounded-t-3xl bg-white px-5 pb-8 pt-4">
      <View className="mb-4 flex-row items-center justify-between"><Text className="text-xl font-extrabold text-slate-900">{modal === 'detalhes' ? 'Detalhes do veículo' : selecionado ? 'Editar veículo' : 'Novo veículo'}</Text><Pressable onPress={() => setModal(null)} className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"><Text className="text-lg text-slate-700">✕</Text></Pressable></View>
      {modal === 'detalhes' && selecionado ? <ScrollView showsVerticalScrollIndicator={false}><View className="mb-4 items-center rounded-2xl bg-blue-50 p-5"><Text className="text-4xl">🚙</Text><Text className="mt-2 text-xl font-extrabold text-slate-900">{selecionado.marca} {selecionado.modelo}</Text><Text className="mt-1 text-sm text-blue-700">{selecionado.placa || 'Sem placa'}</Text><Text className="mt-1 text-xs text-slate-500">ID: {selecionado.id}</Text></View>{[['Marca', selecionado.marca], ['Modelo', selecionado.modelo], ['Ano', String(selecionado.ano ?? '')], ['Placa', selecionado.placa], ['Cor', selecionado.cor], ['Cliente responsável', nomeCliente(selecionado.clienteId)], ['ID do cliente', selecionado.clienteId]].map(([label, value]) => <View key={label} className="mb-3 rounded-xl border border-slate-200 p-3"><Text className="text-xs font-bold uppercase text-slate-400">{label}</Text><Text className="mt-1 text-base text-slate-800">{value || 'Não informado'}</Text></View>)}<Pressable onPress={() => editarVeiculo(selecionado)} className="mt-2 rounded-xl bg-blue-600 py-4"><Text className="text-center font-bold text-white">Editar veículo</Text></Pressable><Pressable onPress={() => confirmarExclusao(selecionado)} className="mt-3 rounded-xl bg-red-50 py-4"><Text className="text-center font-bold text-red-600">Excluir veículo</Text></Pressable></ScrollView> : <><ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><Campo label="Marca *" value={form.marca} onChangeText={(v) => setForm((f) => ({ ...f, marca: v }))} placeholder="Ex.: Honda" /><Campo label="Modelo *" value={form.modelo} onChangeText={(v) => setForm((f) => ({ ...f, modelo: v }))} placeholder="Ex.: Civic" /><Campo label="Ano" value={form.ano} onChangeText={(v) => setForm((f) => ({ ...f, ano: v }))} placeholder="Ex.: 2020" keyboardType="numeric" /><Campo label="Placa *" value={form.placa} onChangeText={(v) => setForm((f) => ({ ...f, placa: v.toUpperCase() }))} placeholder="ABC-1234" /><Campo label="Cor" value={form.cor} onChangeText={(v) => setForm((f) => ({ ...f, cor: v }))} placeholder="Ex.: Prata" /><Text className="mb-1.5 text-sm font-semibold text-slate-700">Cliente responsável *</Text><Pressable onPress={() => setSeletorCliente(true)} className="mb-4 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"><Text className={form.clienteId ? 'flex-1 text-base text-slate-800' : 'flex-1 text-base text-slate-400'}>{form.clienteId ? `${nomeCliente(form.clienteId)} (ID ${form.clienteId})` : 'Selecionar cliente'}</Text><Text className="text-slate-500">⌄</Text></Pressable></ScrollView><Pressable disabled={salvando} onPress={() => { void salvarVeiculo(); }} className={`mt-3 rounded-xl py-4 ${salvando ? 'bg-blue-300' : 'bg-blue-600'}`}><Text className="text-center font-extrabold text-white">{salvando ? 'Salvando...' : selecionado ? 'Salvar alterações' : 'Cadastrar veículo'}</Text></Pressable></>}
    </View></View></Modal>

    <Modal visible={seletorCliente} animationType="fade" transparent onRequestClose={() => setSeletorCliente(false)}><View className="flex-1 justify-center bg-slate-950/50 px-5"><View className="max-h-[75%] rounded-2xl bg-white p-5"><View className="mb-4 flex-row items-center justify-between"><Text className="text-lg font-extrabold text-slate-900">Selecione o cliente</Text><Pressable onPress={() => setSeletorCliente(false)}><Text className="text-xl text-slate-500">✕</Text></Pressable></View><FlatList data={clientes} keyExtractor={(item) => item.id} ListEmptyComponent={<Text className="py-6 text-center text-slate-500">Nenhum cliente cadastrado.</Text>} renderItem={({ item }) => <Pressable onPress={() => { setForm((f) => ({ ...f, clienteId: item.id })); setSeletorCliente(false); }} className={`mb-2 rounded-xl border p-3 ${form.clienteId === item.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}><Text className="font-bold text-slate-800">{item.nome || 'Cliente sem nome'}</Text><Text className="mt-1 text-xs text-slate-500">ID: {item.id}</Text></Pressable>} /></View></View></Modal>
  </View>;
}
