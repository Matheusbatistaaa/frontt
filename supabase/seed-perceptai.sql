-- PerceptAI: dados fictícios para testar as telas integradas ao Supabase.
-- Execute no SQL Editor do projeto de destino. O script não apaga nem sobrescreve dados.
-- Os IDs 9000+ são reservados pelo seed; novos registros usam os nomes de tabela/coluna do schema atual.

begin;

insert into public.usuarios (id, nome, email, senha_hash, role, especialidade, crm_coren, ativo)
values
  (9000, 'Dr. Rafael Mendes', 'rafael.mendes@example.com', '!seed-no-login', 'medico', 'Cardiologia', 'CRM-SP 900001', true),
  (9001, 'Dra. Helena Prado', 'helena.prado@example.com', '!seed-no-login', 'medico', 'Clínica médica', 'CRM-SP 900002', true),
  (9002, 'Dr. Bruno Azevedo', 'bruno.azevedo@example.com', '!seed-no-login', 'medico', 'Neurologia', 'CRM-SP 900003', true),
  (9003, 'Enf. Camila Rocha', 'camila.rocha@example.com', '!seed-no-login', 'enfermeiro', 'UTI adulto', 'COREN-SP 900004', true),
  (9004, 'Admin. PerceptAI', 'admin.perceptai@example.com', '!seed-no-login', 'admin', 'Administração', 'ADM-900005', true)
on conflict (id) do nothing;

insert into public.leitos (id, numero, localizacao, status, tipo, equipamentos)
values
  (9000, '401', 'Ala UTI 2 · Quarto 1', 'ocupado', 'uti', 'Monitor multiparamétrico; bomba de infusão; oxigenoterapia'),
  (9001, '402', 'Ala UTI 2 · Quarto 1', 'ocupado', 'uti', 'Monitor multiparamétrico; ventilador mecânico; bomba de infusão'),
  (9002, '403', 'Ala UTI 2 · Quarto 1', 'ocupado', 'uti', 'Monitor multiparamétrico; bomba de infusão'),
  (9003, '404', 'Ala UTI 2 · Quarto 2', 'ocupado', 'uti', 'Monitor multiparamétrico; ventilador mecânico'),
  (9004, '405', 'Ala UTI 2 · Quarto 2', 'ocupado', 'uti', 'Monitor multiparamétrico; nebulizador'),
  (9005, '406', 'Ala UTI 2 · Quarto 2', 'ocupado', 'uti', 'Monitor multiparamétrico; bomba de infusão'),
  (9006, '407', 'Ala UTI 2 · Quarto 3', 'livre', 'uti', 'Monitor multiparamétrico; bomba de infusão'),
  (9007, '408', 'Ala UTI 2 · Quarto 3', 'livre', 'uti', 'Monitor multiparamétrico'),
  (9008, '409', 'Ala UTI 2 · Quarto 3', 'livre', 'uti', 'Monitor multiparamétrico'),
  (9009, '410', 'Ala UTI 2 · Quarto 4', 'manutencao', 'uti', 'Em manutenção preventiva'),
  (9010, '411', 'Ala UTI 2 · Isolamento', 'livre', 'isolamento', 'Monitor; pressão negativa; EPI'),
  (9011, '412', 'Ala UTI 2 · Quarto 4', 'desativado', 'uti', 'Leito indisponível')
on conflict (id) do nothing;

insert into public.pacientes (
  id, nome, cpf, data_nascimento, genero, convenio, telefone, email, endereco, cidade, estado,
  contato_emergencia, numero_emergencia, alergias
)
values
  (9000, 'Helena Oliveira', '900.000.001-75', '1958-04-12', 'F', 'Unimed', '(11) 90000-0001', 'helena.oliveira@example.com', 'Rua Fictícia, 100', 'São Paulo', 'SP', 'Carlos Oliveira', '(11) 90000-1001', 'Dipirona'),
  (9001, 'Marcos Santos', '900.000.002-56', '1972-09-23', 'M', 'SUS', '(11) 90000-0002', 'marcos.santos@example.com', 'Rua Fictícia, 200', 'São Paulo', 'SP', 'Mariana Santos', '(11) 90000-1002', 'Nenhuma conhecida'),
  (9002, 'Juliana Lima', '900.000.003-37', '1985-02-14', 'F', 'Bradesco Saúde', '(11) 90000-0003', 'juliana.lima@example.com', 'Rua Fictícia, 300', 'São Paulo', 'SP', 'Lucas Lima', '(11) 90000-1003', 'Látex'),
  (9003, 'Antônio Ferreira', '900.000.004-18', '1946-11-05', 'M', 'SUS', '(11) 90000-0004', 'antonio.ferreira@example.com', 'Rua Fictícia, 400', 'São Paulo', 'SP', 'Fernanda Ferreira', '(11) 90000-1004', 'Penicilina'),
  (9004, 'Beatriz Costa', '900.000.005-07', '1994-06-30', 'F', 'SulAmérica', '(11) 90000-0005', 'beatriz.costa@example.com', 'Rua Fictícia, 500', 'São Paulo', 'SP', 'Renata Costa', '(11) 90000-1005', 'Nenhuma conhecida'),
  (9005, 'Roberto Almeida', '900.000.006-80', '1968-01-18', 'M', 'Unimed', '(11) 90000-0006', 'roberto.almeida@example.com', 'Rua Fictícia, 600', 'São Paulo', 'SP', 'Paula Almeida', '(11) 90000-1006', 'Iodo')
on conflict (id) do nothing;

insert into public.internacoes (
  id, paciente_id, leito_id, diagnostico_principal, diagnostico_secundario, medico_responsavel_id,
  data_internacao, observacoes, ativo
)
values
  (9000, 9000, 9000, 'Pós-operatório de revascularização miocárdica', 'Hipertensão arterial; diabetes tipo 2', 9000, current_timestamp - interval '3 days', 'Evolui estável; manter monitorização cardíaca contínua.', true),
  (9001, 9001, 9001, 'Pneumonia associada à ventilação mecânica', 'DPOC', 9001, current_timestamp - interval '5 days', 'Ajuste ventilatório conforme gasometria.', true),
  (9002, 9002, 9002, 'AVC isquêmico agudo', 'Hipertensão arterial', 9002, current_timestamp - interval '2 days', 'Avaliação neurológica seriada e controle de pressão.', true),
  (9003, 9003, 9003, 'Sepse de foco urinário', 'Infecção do trato urinário', 9001, current_timestamp - interval '4 days', 'Antibioticoterapia iniciada; vigiar função renal.', true),
  (9004, 9004, 9004, 'Exacerbação de DPOC', 'Tabagismo prévio', 9001, current_timestamp - interval '1 day', 'Broncodilatador e oxigenoterapia controlada.', true),
  (9005, 9005, 9005, 'Pós-operatório de cirurgia abdominal', 'Hérnia inguinal', 9000, current_timestamp - interval '36 hours', 'Controle álgico e deambulação assistida.', true)
on conflict (id) do nothing;

with parametros (internacao_id, hr, spo2, pas, pad, temp, fr, glicemia) as (
  values
    (9000, 82, 96, 128, 78, 36.7::numeric, 18, 112::numeric),
    (9001, 104, 91, 142, 86, 37.8::numeric, 24, 138::numeric),
    (9002, 76, 97, 136, 82, 36.6::numeric, 17, 98::numeric),
    (9003, 112, 93, 108, 66, 38.1::numeric, 26, 156::numeric),
    (9004, 98, 89, 132, 80, 37.2::numeric, 23, 121::numeric),
    (9005, 88, 95, 124, 76, 36.9::numeric, 19, 105::numeric)
)
insert into public.sinais_vitais (
  id, internacao_id, frequencia_cardiaca, spo2, pressao_arterial_sistolica,
  pressao_arterial_diastolica, temperatura_corporal, frequencia_respiratoria,
  glicemia, timestamp, fonte
)
select
  19000 + (p.internacao_id - 9000) * 4 + s.n,
  p.internacao_id,
  p.hr - (3 - s.n) * 2 + ((p.internacao_id + s.n) % 3 - 1),
  p.spo2 - (3 - s.n),
  p.pas - (3 - s.n) * 2,
  p.pad - (3 - s.n),
  p.temp + (s.n - 2) * 0.1,
  p.fr - (3 - s.n),
  p.glicemia + (3 - s.n) * 2,
  current_timestamp - ((3 - s.n) * 30 + 5) * interval '1 minute',
  'monitor'
from parametros p
cross join generate_series(0, 3) as s(n)
where true
on conflict (id) do nothing;

with parametros (internacao_id, emocao, confianca) as (
  values
    (9000, 'neutro', 94),
    (9001, 'tristeza', 87),
    (9002, 'medo', 82),
    (9003, 'dor', 91),
    (9004, 'sono', 78),
    (9005, 'acordado', 96)
)
insert into public.expressoes_faciais (
  id, internacao_id, emocao, confianca, descricao_detalhada, imagem_hash, timestamp, processado_por
)
select
  19000 + (p.internacao_id - 9000) * 4 + s.n,
  p.internacao_id,
  ((array['neutro', 'tristeza', p.emocao, p.emocao])::text[])[s.n + 1]::public.emocao_facial,
  p.confianca - s.n * 2,
  'Registro fictício para validação do dashboard e da tela de IA.',
  null,
  current_timestamp - ((3 - s.n) * 30 + 5) * interval '1 minute',
  'perceptai_seed'
from parametros p
cross join generate_series(0, 3) as s(n)
where true
on conflict (id) do nothing;

insert into public.medicamentos (
  id, nome, principio_ativo, forma_farmaceutica, concentracao, unidade_medida,
  fabricante, lote, validade, codigo_barra, categoria, preco_unitario
)
values
  (9000, 'Dipirona 500mg/mL', 'Dipirona', 'injecao', '500 mg/mL', 'ampola', 'Laboratório Alfa', 'ALF9000', current_date + 180, '7899000000010', 'Analgésicos', 2.50),
  (9001, 'Morfina 10mg/mL', 'Morfina', 'injecao', '10 mg/mL', 'ampola', 'Laboratório Beta', 'BET9001', current_date + 120, '7899000000027', 'Controlados', 18.90),
  (9002, 'Enoxaparina 40mg/0,4mL', 'Enoxaparina', 'injecao', '40 mg/0,4 mL', 'seringa', 'Laboratório Gama', 'GAM9002', current_date + 240, '7899000000034', 'Anticoagulantes', 32.40),
  (9003, 'Soro Fisiológico 0,9% 500mL', 'Cloreto de sódio', 'injecao', '0,9%', 'frasco', 'Laboratório Delta', 'DEL9003', current_date + 300, '7899000000041', 'Soluções', 4.80),
  (9004, 'Omeprazol 40mg', 'Omeprazol', 'comprimido', '40 mg', 'comprimido', 'Laboratório Épsilon', 'EPS9004', current_date + 200, '7899000000058', 'Gastroprotetores', 1.90),
  (9005, 'Propofol 10mg/mL', 'Propofol', 'injecao', '10 mg/mL', 'ampola', 'Laboratório Zeta', 'ZET9005', current_date + 90, '7899000000065', 'Anestésicos', 27.60),
  (9006, 'Fentanila 50mcg/mL', 'Fentanila', 'injecao', '50 mcg/mL', 'ampola', 'Laboratório Eta', 'ETA9006', current_date + 150, '7899000000072', 'Controlados', 21.30),
  (9007, 'Midazolam 15mg/3mL', 'Midazolam', 'injecao', '15 mg/3 mL', 'ampola', 'Laboratório Teta', 'TET9007', current_date + 110, '7899000000089', 'Sedativos', 16.80),
  (9008, 'Cefazolina 1g', 'Cefazolina', 'injecao', '1 g', 'frasco', 'Laboratório Iota', 'IOT9008', current_date + 160, '7899000000096', 'Antibióticos', 12.70),
  (9009, 'Insulina Regular 100UI/mL', 'Insulina humana regular', 'injecao', '100 UI/mL', 'frasco', 'Laboratório Kappa', 'KAP9009', current_date + 75, '7899000000102', 'Hormônios', 9.90)
on conflict (id) do nothing;

insert into public.estoque (
  id, medicamento_id, quantidade_atual, quantidade_minima, quantidade_maxima,
  localizacao, data_ultima_reposicao, data_proxima_reposicao, fornecedor, preco_unitario
)
values
  (9000, 9000, 150, 50, 300, 'Farmácia UTI 2 · Prateleira A', current_timestamp - interval '7 days', current_date + 14, 'Fornecedor Alfa', 2.50),
  (9001, 9001, 14, 20, 60, 'Farmácia UTI 2 · Cofre controlados', current_timestamp - interval '10 days', current_date + 2, 'Fornecedor Beta', 18.90),
  (9002, 9002, 45, 20, 100, 'Farmácia UTI 2 · Prateleira B', current_timestamp - interval '5 days', current_date + 20, 'Fornecedor Gama', 32.40),
  (9003, 9003, 85, 40, 200, 'Farmácia UTI 2 · Prateleira C', current_timestamp - interval '3 days', current_date + 18, 'Fornecedor Delta', 4.80),
  (9004, 9004, 60, 25, 120, 'Farmácia UTI 2 · Prateleira A', current_timestamp - interval '8 days', current_date + 12, 'Fornecedor Épsilon', 1.90),
  (9005, 9005, 45, 30, 90, 'Farmácia UTI 2 · Cofre anestésicos', current_timestamp - interval '6 days', current_date + 9, 'Fornecedor Zeta', 27.60),
  (9006, 9006, 12, 15, 40, 'Farmácia UTI 2 · Cofre controlados', current_timestamp - interval '12 days', current_date + 1, 'Fornecedor Eta', 21.30),
  (9007, 9007, 18, 10, 50, 'Farmácia UTI 2 · Prateleira B', current_timestamp - interval '4 days', current_date + 16, 'Fornecedor Teta', 16.80),
  (9008, 9008, 8, 12, 40, 'Farmácia UTI 2 · Prateleira D', current_timestamp - interval '9 days', current_date + 3, 'Fornecedor Iota', 12.70),
  (9009, 9009, 25, 15, 60, 'Farmácia UTI 2 · Geladeira', current_timestamp - interval '2 days', current_date + 10, 'Fornecedor Kappa', 9.90)
on conflict (id) do nothing;

insert into public.prescricoes_medicamentos (
  id, internacao_id, medicamento_id, prescrito_por_id, dosagem, via_administracao,
  frequencia, data_inicio, data_fim, observacoes, status
)
values
  (9000, 9000, 9000, 9000, '500 mg', 'EV', '6/6h se dor', current_timestamp - interval '2 days', current_date + 5, 'Analgesia pós-operatória.', 'ativa'),
  (9001, 9001, 9002, 9001, '40 mg', 'SC', '1x/dia', current_timestamp - interval '4 days', current_date + 10, 'Profilaxia de tromboembolismo.', 'ativa'),
  (9002, 9003, 9008, 9001, '1 g', 'EV', '8/8h', current_timestamp - interval '3 days', current_date + 7, 'Antibioticoterapia para sepse urinária.', 'ativa'),
  (9003, 9004, 9003, 9001, '500 mL', 'EV', 'Contínuo', current_timestamp - interval '20 hours', current_date + 3, 'Hidratação e manutenção de acesso venoso.', 'ativa'),
  (9004, 9005, 9004, 9000, '40 mg', 'VO', '1x/dia', current_timestamp - interval '30 hours', current_date + 7, 'Proteção gástrica.', 'ativa'),
  (9005, 9002, 9009, 9002, 'Conforme glicemia', 'SC', '4/4h', current_timestamp - interval '1 day', current_date + 6, 'Controle glicêmico hospitalar.', 'ativa'),
  (9006, 9000, 9001, 9000, '2 mg', 'EV', '4/4h se dor intensa', current_timestamp - interval '1 day', current_date + 3, 'Administrar em bolus lento e reavaliar dor.', 'ativa'),
  (9007, 9001, 9007, 9001, '7,5 mg', 'EV', '12/12h', current_timestamp - interval '2 days', current_date + 4, 'Sedação leve conforme protocolo da UTI.', 'pausada')
on conflict (id) do nothing;

insert into public.administracoes_medicamento (
  id, prescricao_id, administrado_por_id, data_hora_planejada, data_hora_administrada, status, observacoes
)
values
  (9000, 9000, 9003, current_date + time '08:00', current_date + time '08:05', 'administrado', 'Paciente relatou melhora da dor.'),
  (9001, 9001, null, current_date + time '10:00', null, 'pendente', 'Aguardando horário programado.'),
  (9002, 9002, null, current_date - 1 + time '20:00', null, 'atrasado', 'Dose em atraso para revisão.'),
  (9003, 9003, null, current_date + time '12:00', null, 'pendente', 'Conferir volume restante da infusão.'),
  (9004, 9004, 9003, current_date + time '07:00', current_date + time '07:03', 'administrado', 'Administração oral confirmada.'),
  (9005, 9005, null, current_date + time '14:00', null, 'pendente', 'Aguardando controle de glicemia.'),
  (9006, 9006, null, current_date - 1 + time '21:00', null, 'atrasado', 'Reavaliar necessidade e horário.'),
  (9007, 9006, 9003, current_date + time '06:00', current_date + time '06:04', 'administrado', 'Sem intercorrências.'),
  (9008, 9000, null, current_date + 1 + time '08:00', null, 'pendente', 'Próxima dose programada.'),
  (9009, 9003, null, current_date + time '16:00', null, 'pendente', 'Manter bomba de infusão em uso.')
on conflict (id) do nothing;

insert into public.visitantes (
  id, paciente_id, nome_visitante, parentesco, telefone, data_entrada, data_saida,
  status, companhia_permitida, observacoes
)
values
  (9000, 9000, 'Carlos Oliveira', 'Filho', '(11) 90000-1001', current_date + time '13:05', null, 'em-andamento', true, 'Visitante autorizado.'),
  (9001, 9001, 'Mariana Santos', 'Esposa', '(11) 90000-1002', current_date + time '15:10', null, 'em-andamento', true, 'Visitante autorizado.'),
  (9002, 9002, 'Lucas Lima', 'Irmão', '(11) 90000-1003', current_date + time '10:00', current_date + time '10:45', 'finalizada', true, 'Visita encerrada.'),
  (9003, 9003, 'Fernanda Ferreira', 'Filha', '(11) 90000-1004', current_date + time '16:00', null, 'agendada', false, 'Aguardando check-in.'),
  (9004, 9004, 'Renata Costa', 'Mãe', '(11) 90000-1005', current_date + time '17:00', null, 'agendada', false, 'Aguardando check-in.'),
  (9005, 9005, 'Paula Almeida', 'Esposa', '(11) 90000-1006', current_date - 1 + time '13:00', current_date - 1 + time '13:40', 'finalizada', true, 'Visita encerrada.'),
  (9006, 9000, 'Ana Oliveira', 'Neta', '(11) 90000-1007', current_date + time '15:00', null, 'agendada', false, 'Aguardando check-in.'),
  (9007, 9003, 'João Ferreira', 'Neto', '(11) 90000-1008', current_date + time '13:00', current_date + time '13:25', 'finalizada', true, 'Visita encerrada.')
on conflict (id) do nothing;

insert into public.calendario_eventos (
  id, tipo, titulo, descricao, data_hora_inicio, data_hora_fim, local,
  responsavel_id, paciente_id, leito_id, participantes, status, prioridade
)
values
  (9000, 'plantao', 'Plantão UTI 2 — Dr. Rafael Mendes', 'Passagem de plantão da equipe médica.', current_date + time '07:00', current_date + time '19:00', 'Ala UTI 2', 9000, null, null, '["Rafael Mendes", "Helena Prado", "Camila Rocha"]'::jsonb, 'em-andamento', 'alta'),
  (9001, 'consulta', 'Visita multidisciplinar — Leito 401', 'Avaliação cardiológica, enfermagem e fisioterapia.', current_date + time '14:00', current_date + time '14:45', 'Leito 401', 9000, 9000, 9000, '["Rafael Mendes", "Camila Rocha"]'::jsonb, 'agendado', 'media'),
  (9002, 'procedimento', 'Extubação programada — Leito 402', 'Reavaliar critérios ventilatórios antes do procedimento.', current_date + 1 + time '09:30', current_date + 1 + time '10:00', 'Leito 402', 9001, 9001, 9001, '["Helena Prado", "Camila Rocha"]'::jsonb, 'agendado', 'alta'),
  (9003, 'consulta', 'Avaliação neurológica — Leito 403', 'Reavaliação clínica após AVC isquêmico.', current_date + 2 + time '11:00', current_date + 2 + time '11:40', 'Leito 403', 9002, 9002, 9002, '["Bruno Azevedo"]'::jsonb, 'agendado', 'media'),
  (9004, 'plantao', 'Plantão UTI 2 — Dra. Helena Prado', 'Passagem de plantão da equipe médica.', current_date + 3 + time '07:00', current_date + 3 + time '19:00', 'Ala UTI 2', 9001, null, null, '["Helena Prado", "Bruno Azevedo", "Camila Rocha"]'::jsonb, 'agendado', 'alta'),
  (9005, 'procedimento', 'Coleta de gasometria geral', 'Coleta e processamento de amostras arteriais.', current_date - 1 + time '15:00', current_date - 1 + time '15:30', 'Ala UTI 2', 9003, null, null, '["Camila Rocha"]'::jsonb, 'finalizado', 'media'),
  (9006, 'procedimento', 'Troca de curativos centrais', 'Realizar antissepsia e troca conforme protocolo.', current_date + 4 + time '16:00', current_date + 4 + time '17:00', 'Ala UTI 2', 9003, 9003, 9003, '["Camila Rocha"]'::jsonb, 'agendado', 'alta'),
  (9007, 'reuniao', 'Reunião de alta hospitalar — Leito 404', 'Alinhar critérios e planejamento de alta.', current_date + 5 + time '10:00', current_date + 5 + time '11:00', 'Sala de reuniões', 9004, 9003, 9003, '["Helena Prado", "Camila Rocha", "Administração"]'::jsonb, 'agendado', 'media'),
  (9008, 'consulta', 'Avaliação cardiológica — Leito 401', 'Controle de sintomas e exames pós-operatórios.', current_date + 6 + time '08:00', current_date + 6 + time '08:40', 'Leito 401', 9000, 9000, 9000, '["Rafael Mendes"]'::jsonb, 'agendado', 'media'),
  (9009, 'plantao', 'Plantão UTI 2 — Dr. Bruno Azevedo', 'Plantão noturno e passagem de plantão.', current_date + 7 + time '13:00', current_date + 7 + time '19:00', 'Ala UTI 2', 9002, null, null, '["Bruno Azevedo", "Camila Rocha"]'::jsonb, 'agendado', 'alta')
on conflict (id) do nothing;

insert into public.movimentacoes_estoque (
  id, estoque_id, tipo_movimentacao, quantidade, motivo, responsavel_id, data_hora, numero_nf, observacoes
)
values
  (9000, 9000, 'entrada', 100, 'Reposição programada', 9003, current_timestamp - interval '7 days', 'NF-900001', 'Recebimento conferido.'),
  (9001, 9001, 'saida', 6, 'Administração em leitos', 9003, current_timestamp - interval '1 day', null, 'Baixa por uso assistencial.'),
  (9002, 9002, 'entrada', 50, 'Reposição de anticoagulantes', 9003, current_timestamp - interval '5 days', 'NF-900002', null),
  (9003, 9006, 'saida', 3, 'Administração controlada', 9003, current_timestamp - interval '12 hours', null, 'Registro fictício de controle.'),
  (9004, 9008, 'perda', 2, 'Validade vencida', 9004, current_timestamp - interval '9 days', null, 'Descarte conforme protocolo.'),
  (9005, 9009, 'entrada', 30, 'Reposição de insulina', 9003, current_timestamp - interval '2 days', 'NF-900003', 'Armazenamento em geladeira.')
on conflict (id) do nothing;

DO $$
DECLARE
  tabela text;
  sequencia text;
  maior_id bigint;
BEGIN
  FOREACH tabela IN ARRAY ARRAY[
    'usuarios',
    'leitos',
    'pacientes',
    'internacoes',
    'sinais_vitais',
    'expressoes_faciais',
    'medicamentos',
    'estoque',
    'prescricoes_medicamentos',
    'administracoes_medicamento',
    'visitantes',
    'calendario_eventos',
    'movimentacoes_estoque'
  ] LOOP
    sequencia := pg_get_serial_sequence('public.' || tabela, 'id');
    IF sequencia IS NOT NULL THEN
      EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM public.%I', tabela) INTO maior_id;
      EXECUTE format(
        'SELECT setval(%L::regclass, GREATEST(%s, (SELECT last_value FROM %s)), true)',
        sequencia,
        maior_id,
        sequencia
      );
    END IF;
  END LOOP;
END
$$;

commit;
