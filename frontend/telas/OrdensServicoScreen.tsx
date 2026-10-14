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

type Cliente = { id: string; nome?: string };
type Veiculo = { id: string; marca?: string; modelo?: string; placa?: string; clienteId?: string };
type OrdemServico = { id: string; clienteId?: string; veiculoId?: string; descricao?: string; dataEntrada?: string; valorEstimado?: string | number; status?: string };
type FormOrdem = { clienteId: string; veiculoId: string; descricao: string; dataEntrada: string; valorEstimado: string; status: string };

// Android Emulator: use 10.0.2.2. On a physical phone, replace it with your PC's local IPv4.
// Expo Web / browser on the same computer: use http://localhost:3000.
const API_URL = 'http://10.0.2.2:3000';
const FORM_VAZIO: FormOrdem = { clienteId: '', veiculoId: '', descricao: '', dataEntrada: new Date().toLocaleDateString('pt-BR'), valorEstimado: '', status: 'Aberta' };

type CampoProps = { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'default' | 'numeric'; multiline?: boolean };
function Campo({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }: CampoProps) {
  return <View className="mb-4"><Text className="mb-1.5 text-sm font-semibold text-slate-700">{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder ?? label} placeholderTextColor="#94A3B8" keyboardType={keyboardType} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} className={`rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base text-slate-800 ${multiline ? 'min-h-24' : ''}`} /></View>;
}

export default function OrdensServicoScreen() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [modal, setModal] = useState<'form' | 'detalhes' | null>(null);
  const [seletor, setSeletor] = useState<'cliente' | 'veiculo' | null>(null);
  const [selecionado, setSelecionado] = useState<OrdemServico | null>(null);
  const [form, setForm] = useState<FormOrdem>(FORM_VAZIO);

  const carregarDados = useCallback(async (refresh = false) => {
    if (refresh) setAtualizando(true); else setCarregando(true);
    try {
      const [resOrdens, resClientes, resVeiculos] = await Promise.all([
        fetch(`${API_URL}/ordens-servico`), fetch(`${API_URL}/clientes`), fetch(`${API_URL}/veiculos`),
      ]);
      const [dadosOrdens, dadosClientes, dadosVeiculos] = await Promise.all([resOrdens.json(), resClientes.json(), resVeiculos.json()]);
      if (!resOrdens.ok) throw new Error(dadosOrdens?.erro ?? 'Não foi possível carregar as ordens de serviço.');
      if (!resClientes.ok) throw new Error(dadosClientes?.erro ?? 'Não foi possível carregar os clientes.');
      if (!resVeiculos.ok) throw new Error(dadosVeiculos?.erro ?? 'Não foi possível carregar os veículos.');
      setOrdens(Array.isArray(dadosOrdens) ? dadosOrdens : []);
      setClientes(Array.isArray(dadosClientes) ? dadosClientes : []);
      setVeiculos(Array.isArray(dadosVeiculos) ? dadosVeiculos : []);
    } catch (erro) {
      Alert.alert('Erro de conexão', erro instanceof Error ? `${erro.message}\n\nConfira se o backend está rodando e se API_URL está correta.` : 'Não foi possível conectar à API.');
    } finally { setCarregando(false); setAtualizando(false); }
  }, []);

  useEffect(() => { void carregarDados(); }, [carregarDados]);
  const nomeCliente = (id?: string) => clientes.find((cliente) => cliente.id === id)?.nome ?? (id ? `Cliente ${id}` : 'Cliente não selecionado');
  const nomeVeiculo = (id?: string) => { const v = veiculos.find((item) => item.id === id); return v ? `${v.marca ?? ''} ${v.modelo ?? ''}${v.placa ? ` • ${v.placa}` : ''}`.trim() : id ? `Veículo ${id}` : 'Veículo não selecionado'; };
  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return ordens;
    return ordens.filter((os) => [os.id, os.descricao, os.status, nomeCliente(os.clienteId), nomeVeiculo(os.veiculoId)].some((valor) => (valor ?? '').toLowerCase().includes(termo)));
  }, [ordens, busca, clientes, veiculos]);

  function novaOrdem() {
    setSelecionado(null);
    setForm({ ...FORM_VAZIO, clienteId: clientes[0]?.id ?? '', veiculoId: veiculos[0]?.id ?? '' });
    setModal('form');
  }
  async function consultarOrdem(os: OrdemServico) {
    try {
      const resposta = await fetch(`${API_URL}/ordens-servico/${os.id}`); const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados?.erro ?? 'Não foi possível consultar a ordem.');
      setSelecionado(dados); setModal('detalhes');
    } catch (erro) { Alert.alert('Erro', erro instanceof Error ? erro.message : 'Falha ao consultar ordem.'); }
  }
  function editarOrdem(os: OrdemServico) {
    setSelecionado(os);
    setForm({ clienteId: os.clienteId ?? '', veiculoId: os.veiculoId ?? '', descricao: os.descricao ?? '', dataEntrada: os.dataEntrada ?? '', valorEstimado: String(os.valorEstimado ?? ''), status: os.status ?? 'Aberta' });
    setModal('form');
  }
  function alterar(campo: keyof FormOrdem, valor: string) { setForm((atual) => ({ ...atual, [campo]: valor })); }

  async function salvarOrdem() {
    if (!form.clienteId || !form.veiculoId || !form.descricao.trim()) {
      Alert.alert('Campos obrigatórios', 'Selecione o cliente e o veículo e informe a descrição do serviço.'); return;
    }
    setSalvando(true);
    try {
      const editando = Boolean(selecionado?.id);
      const resposta = await fetch(editando ? `${API_URL}/ordens-servico/${selecionado!.id}` : `${API_URL}/ordens-servico`, {
        method: editando ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados?.erro ?? 'Não foi possível salvar a ordem de serviço.');
      setModal(null); await carregarDados(true); Alert.alert('Sucesso', editando ? 'Ordem de serviço atualizada.' : 'Ordem de serviço aberta.');
    } catch (erro) { Alert.alert('Erro', erro instanceof Error ? erro.message : 'Falha ao salvar a ordem.'); }
    finally { setSalvando(false); }
  }
  function confirmarExclusao(os: OrdemServico) {
    Alert.alert('Excluir ordem de serviço?', `A OS #${os.id} será excluída. Deseja continuar?`, [
      { text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: () => { void excluirOrdem(os); } },
    ]);
  }
  async function excluirOrdem(os: OrdemServico) {
    try {
      const resposta = await fetch(`${API_URL}/ordens-servico/${os.id}`, { method: 'DELETE' });
      if (!resposta.ok) { const dados = await resposta.json().catch(() => ({})); throw new Error(dados?.erro ?? 'Não foi possível excluir a ordem.'); }
      if (selecionado?.id === os.id) setModal(null);
      await carregarDados(true); Alert.alert('Sucesso', 'Ordem de serviço excluída.');
    } catch (erro) { Alert.alert('Erro', erro instanceof Error ? erro.message : 'Falha ao excluir ordem.'); }
  }

  const statusClasses = (status?: string) => status === 'Concluída' ? 'bg-emerald-100 text-emerald-700' : status === 'Em andamento' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';

  return <View className="flex-1 bg-slate-50">
    <View className="bg-blue-700 px-5 pb-6 pt-5"><Text className="text-sm font-semibold text-blue-100">OFICINAPRO  /  SERVIÇOS</Text><Text className="mt-2 text-3xl font-extrabold text-white">Ordens de serviço</Text><Text className="mt-1 text-sm text-blue-100">Acompanhe os serviços da oficina.</Text><View className="mt-5 flex-row items-center rounded-2xl bg-white/15 px-4 py-3"><Text className="mr-2 text-lg text-white">⌕</Text><TextInput value={busca} onChangeText={setBusca} placeholder="Buscar OS, cliente ou serviço" placeholderTextColor="#DBEAFE" className="flex-1 text-sm text-white" /></View></View>
    <View className="-mt-3 flex-1 rounded-t-3xl bg-slate-50 px-4 pt-5"><View className="mb-4 flex-row items-center justify-between"><View><Text className="text-lg font-bold text-slate-900">Ordens registradas</Text><Text className="mt-1 text-sm text-slate-500">{ordens.length} ordem(ns)</Text></View><Pressable onPress={novaOrdem} className="rounded-xl bg-blue-600 px-4 py-3"><Text className="font-bold text-white">＋ Nova OS</Text></Pressable></View>
      {carregando ? <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#2563EB" /><Text className="mt-3 text-slate-500">Carregando ordens...</Text></View> : <FlatList data={filtradas} keyExtractor={(item) => item.id} refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { void carregarDados(true); }} tintColor="#2563EB" />} contentContainerStyle={{ paddingBottom: 28, flexGrow: 1 }} ListEmptyComponent={<View className="flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8"><Text className="text-3xl">🧾</Text><Text className="mt-3 text-lg font-bold text-slate-800">Nenhuma ordem encontrada</Text><Text className="mt-1 text-center text-sm text-slate-500">Abra uma nova ordem para registrar um serviço.</Text></View>} renderItem={({ item }) => <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Pressable onPress={() => { void consultarOrdem(item); }}><View className="flex-row items-start justify-between"><View className="flex-1 pr-2"><Text className="text-xs font-bold uppercase text-slate-400">Ordem de serviço</Text><Text className="mt-1 text-lg font-extrabold text-slate-900">OS #{item.id}</Text></View><View className={`rounded-full px-3 py-1.5 ${statusClasses(item.status).split(' ')[0]}`}><Text className={`text-xs font-bold ${statusClasses(item.status).split(' ')[1]}`}>{item.status || 'Aberta'}</Text></View></View><Text className="mt-3 text-sm font-semibold text-slate-800">{nomeCliente(item.clienteId)}</Text><Text className="mt-1 text-sm text-slate-500">{nomeVeiculo(item.veiculoId)}</Text><Text numberOfLines={2} className="mt-3 text-sm text-slate-600">{item.descricao || 'Sem descrição do serviço'}</Text><View className="mt-3 flex-row items-center justify-between"><Text className="text-xs text-slate-400">Entrada: {item.dataEntrada || 'Não informada'}</Text><Text className="font-extrabold text-slate-900">{item.valorEstimado ? `R$ ${String(item.valorEstimado)}` : 'Sem estimativa'}</Text></View></Pressable><View className="mt-4 flex-row border-t border-slate-100 pt-3"><Pressable onPress={() => editarOrdem(item)} className="mr-2 flex-1 rounded-xl bg-blue-50 py-2.5"><Text className="text-center font-bold text-blue-700">Editar</Text></Pressable><Pressable onPress={() => confirmarExclusao(item)} className="flex-1 rounded-xl bg-red-50 py-2.5"><Text className="text-center font-bold text-red-600">Excluir</Text></Pressable></View></View>} />}
    </View>

    <Modal visible={modal !== null} animationType="slide" transparent onRequestClose={() => setModal(null)}><View className="flex-1 justify-end bg-slate-950/40"><View className="max-h-[92%] rounded-t-3xl bg-white px-5 pb-8 pt-4"><View className="mb-4 flex-row items-center justify-between"><Text className="text-xl font-extrabold text-slate-900">{modal === 'detalhes' ? 'Detalhes da ordem' : selecionado ? 'Editar ordem de serviço' : 'Nova ordem de serviço'}</Text><Pressable onPress={() => setModal(null)} className="h-9 w-9 items-center justify-center rounded-full bg-slate-100"><Text className="text-lg text-slate-700">✕</Text></Pressable></View>
      {modal === 'detalhes' && selecionado ? <ScrollView showsVerticalScrollIndicator={false}><View className="mb-4 rounded-2xl bg-blue-50 p-5"><View className="flex-row items-center justify-between"><Text className="text-xs font-bold uppercase text-blue-700">Ordem de serviço</Text><View className={`rounded-full px-3 py-1.5 ${statusClasses(selecionado.status).split(' ')[0]}`}><Text className={`text-xs font-bold ${statusClasses(selecionado.status).split(' ')[1]}`}>{selecionado.status || 'Aberta'}</Text></View></View><Text className="mt-2 text-2xl font-extrabold text-slate-900">OS #{selecionado.id}</Text><Text className="mt-2 text-sm text-slate-600">{selecionado.descricao || 'Sem descrição'}</Text></View>{[['Cliente', nomeCliente(selecionado.clienteId)], ['ID do cliente', selecionado.clienteId], ['Veículo', nomeVeiculo(selecionado.veiculoId)], ['ID do veículo', selecionado.veiculoId], ['Data de entrada', selecionado.dataEntrada], ['Valor estimado', selecionado.valorEstimado ? `R$ ${selecionado.valorEstimado}` : 'Não informado']].map(([label, value]) => <View key={label} className="mb-3 rounded-xl border border-slate-200 p-3"><Text className="text-xs font-bold uppercase text-slate-400">{label}</Text><Text className="mt-1 text-base text-slate-800">{value || 'Não informado'}</Text></View>)}<Pressable onPress={() => editarOrdem(selecionado)} className="mt-2 rounded-xl bg-blue-600 py-4"><Text className="text-center font-bold text-white">Editar ordem</Text></Pressable><Pressable onPress={() => confirmarExclusao(selecionado)} className="mt-3 rounded-xl bg-red-50 py-4"><Text className="text-center font-bold text-red-600">Excluir ordem</Text></Pressable></ScrollView> : <><ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><Text className="mb-1.5 text-sm font-semibold text-slate-700">Cliente *</Text><Pressable onPress={() => setSeletor('cliente')} className="mb-4 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"><Text className={form.clienteId ? 'flex-1 text-base text-slate-800' : 'flex-1 text-base text-slate-400'}>{form.clienteId ? `${nomeCliente(form.clienteId)} (ID ${form.clienteId})` : 'Selecionar cliente'}</Text><Text className="text-slate-500">⌄</Text></Pressable>
        <Text className="mb-1.5 text-sm font-semibold text-slate-700">Veículo *</Text><Pressable onPress={() => setSeletor('veiculo')} className="mb-4 flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"><Text className={form.veiculoId ? 'flex-1 text-base text-slate-800' : 'flex-1 text-base text-slate-400'}>{form.veiculoId ? nomeVeiculo(form.veiculoId) : 'Selecionar veículo'}</Text><Text className="text-slate-500">⌄</Text></Pressable>
        <Campo label="Descrição do serviço *" value={form.descricao} onChangeText={(v) => alterar('descricao', v)} placeholder="Ex.: Revisão geral e troca de óleo" multiline /><Campo label="Data de entrada" value={form.dataEntrada} onChangeText={(v) => alterar('dataEntrada', v)} placeholder="dd/mm/aaaa" /><Campo label="Valor estimado (R$)" value={form.valorEstimado} onChangeText={(v) => alterar('valorEstimado', v)} placeholder="Ex.: 350,00" keyboardType="numeric" />
        <Text className="mb-2 text-sm font-semibold text-slate-700">Status</Text><View className="mb-4 flex-row flex-wrap">{['Aberta', 'Em andamento', 'Concluída'].map((status) => <Pressable key={status} onPress={() => alterar('status', status)} className={`mb-2 mr-2 rounded-full border px-3 py-2 ${form.status === status ? 'border-blue-600 bg-blue-600' : 'border-slate-200 bg-white'}`}><Text className={`text-sm font-bold ${form.status === status ? 'text-white' : 'text-slate-600'}`}>{status}</Text></Pressable>)}</View></ScrollView><Pressable disabled={salvando} onPress={() => { void salvarOrdem(); }} className={`mt-3 rounded-xl py-4 ${salvando ? 'bg-blue-300' : 'bg-blue-600'}`}><Text className="text-center font-extrabold text-white">{salvando ? 'Salvando...' : selecionado ? 'Salvar alterações' : 'Abrir ordem de serviço'}</Text></Pressable></>}
    </View></View></Modal>

    <Modal visible={seletor !== null} animationType="fade" transparent onRequestClose={() => setSeletor(null)}><View className="flex-1 justify-center bg-slate-950/50 px-5"><View className="max-h-[75%] rounded-2xl bg-white p-5"><View className="mb-4 flex-row items-center justify-between"><Text className="text-lg font-extrabold text-slate-900">{seletor === 'cliente' ? 'Selecione o cliente' : 'Selecione o veículo'}</Text><Pressable onPress={() => setSeletor(null)}><Text className="text-xl text-slate-500">✕</Text></Pressable></View>{seletor === 'cliente' ? <FlatList data={clientes} keyExtractor={(item) => item.id} ListEmptyComponent={<Text className="py-6 text-center text-slate-500">Cadastre um cliente antes de abrir uma ordem.</Text>} renderItem={({ item }) => <Pressable onPress={() => { setForm((f) => ({ ...f, clienteId: item.id, veiculoId: veiculos.some((v) => v.id === f.veiculoId && v.clienteId === item.id) ? f.veiculoId : '' })); setSeletor(null); }} className={`mb-2 rounded-xl border p-3 ${form.clienteId === item.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}><Text className="font-bold text-slate-800">{item.nome || 'Cliente sem nome'}</Text><Text className="mt-1 text-xs text-slate-500">ID: {item.id}</Text></Pressable>} /> : <FlatList data={veiculos.filter((v) => !form.clienteId || !v.clienteId || v.clienteId === form.clienteId)} keyExtractor={(item) => item.id} ListEmptyComponent={<Text className="py-6 text-center text-slate-500">Nenhum veículo para esse cliente. Cadastre um veículo primeiro.</Text>} renderItem={({ item }) => <Pressable onPress={() => { setForm((f) => ({ ...f, veiculoId: item.id, clienteId: f.clienteId || item.clienteId || '' })); setSeletor(null); }} className={`mb-2 rounded-xl border p-3 ${form.veiculoId === item.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}><Text className="font-bold text-slate-800">{item.marca || 'Marca'} {item.modelo || 'Modelo'}</Text><Text className="mt-1 text-xs text-slate-500">{item.placa || 'Sem placa'} • ID: {item.id}</Text><Text className="mt-1 text-xs text-slate-500">Responsável: {nomeCliente(item.clienteId)}</Text></Pressable>} />}</View></View></Modal>
  </View>;
}
