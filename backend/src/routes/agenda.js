if (!validacao.ok && validacao.motivo === 'conflito') {
    return res.status(409).json({
      erro: 'Conflito de horário: o consultor já tem um compromisso nesse intervalo.',
      conflito: validacao.conflito,
    });
  }

  if (!validacao.ok && validacao.motivo === 'descanso') {
    return res.status(409).json({ erro: validacao.mensagem });
  }