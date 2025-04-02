// Gestione dello stato dell'applicazione
let state = {
    nomeAzienda: '',
    transazioni: [],
    prodotti: [],
    dipendenti: [],
    ultimaTransazioneId: null,
    ultimoAggiornamento: null
};

// Gestione della navigazione
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

// Gestione del form azienda
document.getElementById('aziendaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const nomeAzienda = document.getElementById('nomeAzienda').value;
    state.nomeAzienda = nomeAzienda;
    localStorage.setItem('nomeAzienda', nomeAzienda);
    
    // Mostra un messaggio di conferma
    alert('Nome azienda salvato con successo!');
    
    // Passa automaticamente alla sezione dipendenti
    showSection('dipendenti');
});

// Gestione dipendenti
function modificaDipendenti(delta) {
    state.numeroDipendenti = Math.max(0, state.numeroDipendenti + delta);
    document.getElementById('numeroDipendenti').textContent = state.numeroDipendenti;
    localStorage.setItem('numeroDipendenti', state.numeroDipendenti);
}

// Gestione form dipendenti
document.getElementById('dipendenteForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nuovoDipendente = {
        id: Date.now(),
        nome: document.getElementById('nomeDipendente').value,
        cognome: document.getElementById('cognomeDipendente').value,
        ruolo: document.getElementById('ruoloDipendente').value,
        stipendio: parseFloat(document.getElementById('stipendioDipendente').value)
    };
    
    state.dipendenti.push(nuovoDipendente);
    localStorage.setItem('dipendenti', JSON.stringify(state.dipendenti));
    aggiornaListaDipendenti();
    
    this.reset();
});

// Gestione transazioni
document.getElementById('transazioneForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const tipo = document.querySelector('input[name="tipoTransazione"]:checked').value;
    const importo = parseFloat(document.getElementById('importo').value);
    const descrizione = document.getElementById('descrizione').value;
    const categoria = document.getElementById('categoria').value;
    
    const nuovaTransazione = {
        id: Date.now(),
        data: new Date(),
        tipo,
        importo,
        descrizione,
        categoria,
        nuova: true
    };
    
    state.transazioni.unshift(nuovaTransazione);
    state.ultimaTransazioneId = nuovaTransazione.id;
    state.ultimoAggiornamento = new Date();
    localStorage.setItem('transazioni', JSON.stringify(state.transazioni));
    
    aggiornaRiepilogoFinanze();
    filtraTransazioni('tutte');
    
    // Evidenzia la nuova transazione per 5 secondi
    setTimeout(() => {
        const elemento = document.querySelector(`[data-transazione-id="${nuovaTransazione.id}"]`);
        if (elemento) {
            elemento.classList.remove('nuova');
        }
    }, 5000);
    
    this.reset();
    // Resetta il radio button all'opzione "entrata"
    document.getElementById('entrata').checked = true;
});

function aggiornaRiepilogoFinanze() {
    const totaleEntrate = state.transazioni
        .filter(t => t.tipo === 'entrata')
        .reduce((sum, t) => sum + t.importo, 0);
    
    const totaleUscite = state.transazioni
        .filter(t => t.tipo === 'uscita')
        .reduce((sum, t) => sum + t.importo, 0);
    
    const utileNetto = totaleEntrate - totaleUscite;
    
    document.getElementById('totaleEntrate').textContent = `€${totaleEntrate.toFixed(2)}`;
    document.getElementById('totaleUscite').textContent = `€${totaleUscite.toFixed(2)}`;
    document.getElementById('utileNetto').textContent = `€${utileNetto.toFixed(2)}`;
    
    // Aggiorna il colore dell'utile netto
    const utileElement = document.getElementById('utileNetto');
    utileElement.className = 'value ' + (utileNetto >= 0 ? 'positive' : 'negative');
}

function filtraTransazioni(tipo) {
    const container = document.getElementById('listaTransazioni');
    container.innerHTML = '';
    
    const transazioniFiltrate = tipo === 'tutte' 
        ? state.transazioni 
        : state.transazioni.filter(t => t.tipo === tipo);
    
    transazioniFiltrate.forEach(transazione => {
        const data = new Date(transazione.data).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const item = document.createElement('div');
        item.className = `transazione-item ${transazione.nuova ? 'nuova' : ''}`;
        item.setAttribute('data-transazione-id', transazione.id);
        
        item.innerHTML = `
            <div class="transazione-info">
                <div class="transazione-data">${data}</div>
                <div class="transazione-descrizione">${transazione.descrizione}</div>
                <span class="transazione-categoria">${transazione.categoria}</span>
            </div>
            <div class="transazione-importo ${transazione.tipo === 'entrata' ? 'positive' : 'negative'}">
                ${transazione.tipo === 'entrata' ? '+' : '-'}€${transazione.importo.toFixed(2)}
            </div>
        `;
        container.appendChild(item);
    });
}

// Gestione grafico finanze
function aggiornaGraficoFinanze() {
    const ctx = document.getElementById('graficoFinanze').getContext('2d');
    
    // Raggruppa le transazioni per mese
    const transazioniPerMese = {
        entrate: {},
        uscite: {}
    };
    
    state.transazioni.forEach(transazione => {
        const mese = transazione.data.toLocaleString('it-IT', { month: 'long' });
        if (!transazioniPerMese[transazione.tipo][mese]) {
            transazioniPerMese[transazione.tipo][mese] = 0;
        }
        transazioniPerMese[transazione.tipo][mese] += transazione.importo;
    });
    
    // Ottieni tutti i mesi unici
    const mesi = [...new Set([
        ...Object.keys(transazioniPerMese.entrate),
        ...Object.keys(transazioniPerMese.uscite)
    ])].sort();
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: mesi,
            datasets: [
                {
                    label: 'Entrate',
                    data: mesi.map(mese => transazioniPerMese.entrate[mese] || 0),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Uscite',
                    data: mesi.map(mese => transazioniPerMese.uscite[mese] || 0),
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    tension: 0.1,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Andamento Finanziario'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: €${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '€' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Gestione magazzino
document.getElementById('prodottoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nomeProdotto = document.getElementById('nomeProdotto').value;
    const quantita = parseInt(document.getElementById('quantita').value);
    
    // Crea un nuovo prodotto con ID univoco
    const nuovoProdotto = {
        id: Date.now(),
        nome: nomeProdotto,
        quantita: quantita
    };
    
    state.prodotti.push(nuovoProdotto);
    localStorage.setItem('prodotti', JSON.stringify(state.prodotti));
    aggiornaListaProdotti();
    
    // Resetta il form e ripristina il pulsante
    this.reset();
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.innerHTML = '<i class="fas fa-plus me-2"></i>Aggiungi Prodotto';
});

function aggiornaListaProdotti() {
    const container = document.getElementById('listaProdotti');
    container.innerHTML = '';
    
    state.prodotti.forEach(prodotto => {
        container.insertAdjacentHTML('beforeend', creaCardProdotto(prodotto));
    });
}

function rimuoviProdotto(nome) {
    state.prodotti = state.prodotti.filter(p => p.nome !== nome);
    localStorage.setItem('prodotti', JSON.stringify(state.prodotti));
    aggiornaListaProdotti();
}

function aggiornaListaDipendenti() {
    const container = document.getElementById('listaDipendenti');
    container.innerHTML = '';
    
    state.dipendenti.forEach(dipendente => {
        const card = creaCardDipendente(dipendente);
        container.appendChild(card);
    });
}

function modificaDipendente(id) {
    const dipendente = state.dipendenti.find(d => d.id === id);
    if (!dipendente) return;
    
    document.getElementById('nomeDipendente').value = dipendente.nome;
    document.getElementById('cognomeDipendente').value = dipendente.cognome;
    document.getElementById('ruoloDipendente').value = dipendente.ruolo;
    document.getElementById('stipendioDipendente').value = dipendente.stipendio;
    
    // Rimuovi il dipendente dalla lista
    state.dipendenti = state.dipendenti.filter(d => d.id !== id);
    localStorage.setItem('dipendenti', JSON.stringify(state.dipendenti));
    aggiornaListaDipendenti();
}

function eliminaDipendente(id) {
    if (confirm('Sei sicuro di voler eliminare questo dipendente?')) {
        state.dipendenti = state.dipendenti.filter(d => d.id !== id);
        localStorage.setItem('dipendenti', JSON.stringify(state.dipendenti));
        aggiornaListaDipendenti();
    }
}

// Caricamento dati salvati
function caricaDatiSalvati() {
    state.nomeAzienda = localStorage.getItem('nomeAzienda') || '';
    state.transazioni = JSON.parse(localStorage.getItem('transazioni')) || [];
    state.prodotti = JSON.parse(localStorage.getItem('prodotti')) || [];
    state.dipendenti = JSON.parse(localStorage.getItem('dipendenti')) || [];
    
    // Aggiorna l'interfaccia
    document.getElementById('nomeAzienda').value = state.nomeAzienda;
    aggiornaListaProdotti();
    aggiornaListaDipendenti();
    aggiornaRiepilogoFinanze();
    filtraTransazioni('tutte');
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    caricaDatiSalvati();
    showSection('home');
});

// Funzione per controllare gli aggiornamenti in tempo reale
function controllaAggiornamenti() {
    const transazioniSalvate = JSON.parse(localStorage.getItem('transazioni')) || [];
    
    if (transazioniSalvate.length > state.transazioni.length) {
        const nuoveTransazioni = transazioniSalvate.filter(t => 
            !state.transazioni.some(et => et.id === t.id)
        );
        
        if (nuoveTransazioni.length > 0) {
            state.transazioni = transazioniSalvate;
            state.ultimoAggiornamento = new Date();
            
            aggiornaRiepilogoFinanze();
            filtraTransazioni('tutte');
            
            nuoveTransazioni.forEach(transazione => {
                const elemento = document.querySelector(`[data-transazione-id="${transazione.id}"]`);
                if (elemento) {
                    elemento.classList.add('nuova');
                    setTimeout(() => {
                        elemento.classList.remove('nuova');
                    }, 5000);
                }
            });
        }
    }
}

// Avvia il controllo in tempo reale
setInterval(controllaAggiornamenti, 2000); // Controlla ogni 2 secondi

function aggiornaBilancioCategorie() {
    const container = document.getElementById('bilancioCategorie');
    container.innerHTML = '';
    
    // Raggruppa le transazioni per categoria
    const bilancioCategorie = {};
    
    state.transazioni.forEach(transazione => {
        if (!bilancioCategorie[transazione.categoria]) {
            bilancioCategorie[transazione.categoria] = {
                entrate: 0,
                uscite: 0
            };
        }
        
        if (transazione.tipo === 'entrata') {
            bilancioCategorie[transazione.categoria].entrate += transazione.importo;
        } else {
            bilancioCategorie[transazione.categoria].uscite += transazione.importo;
        }
    });
    
    // Calcola il totale massimo per la scala delle barre
    const totali = Object.values(bilancioCategorie).map(cat => 
        Math.max(cat.entrate, cat.uscite)
    );
    const maxTotale = Math.max(...totali);
    
    // Crea gli elementi per ogni categoria
    Object.entries(bilancioCategorie).forEach(([categoria, valori]) => {
        const saldo = valori.entrate - valori.uscite;
        const percentuale = maxTotale > 0 ? (Math.abs(saldo) / maxTotale) * 100 : 0;
        
        const item = document.createElement('div');
        item.className = 'categoria-item';
        item.innerHTML = `
            <div class="categoria-info">
                <span class="categoria-nome">${categoria}</span>
                <span class="categoria-valore ${saldo >= 0 ? 'positive' : 'negative'}">
                    ${saldo >= 0 ? '+' : '-'}€${Math.abs(saldo).toFixed(2)}
                </span>
            </div>
            <div class="categoria-barra">
                <div class="categoria-barra-fill ${saldo >= 0 ? 'positive' : 'negative'}"
                     style="width: ${percentuale}%">
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

// Funzione per cancellare la cronologia delle transazioni
function cancellaCronologiaTransazioni() {
    if (confirm('Sei sicuro di voler cancellare tutte le transazioni? Questa azione non può essere annullata.')) {
        state.transazioni = [];
        localStorage.setItem('transazioni', JSON.stringify(state.transazioni));
        aggiornaRiepilogoFinanze();
        filtraTransazioni('tutte');
        
        // Mostra un messaggio di conferma
        alert('Cronologia delle transazioni cancellata con successo!');
    }
}

// Funzione per ordinare i dipendenti
function ordinaDipendenti(criterio) {
    const container = document.getElementById('listaDipendenti');
    const dipendenti = Array.from(container.children);
    
    dipendenti.sort((a, b) => {
        if (criterio === 'nome') {
            const nomeA = a.querySelector('h6').textContent.toLowerCase();
            const nomeB = b.querySelector('h6').textContent.toLowerCase();
            return nomeA.localeCompare(nomeB);
        } else if (criterio === 'stipendio') {
            const stipendioA = parseFloat(a.querySelector('.stipendio').textContent.replace('€', ''));
            const stipendioB = parseFloat(b.querySelector('.stipendio').textContent.replace('€', ''));
            return stipendioB - stipendioA;
        }
        return 0;
    });
    
    // Rimuovi e riaggiungi gli elementi nell'ordine corretto
    dipendenti.forEach(dipendente => container.appendChild(dipendente));
}

// Funzione per ordinare i prodotti
function ordinaProdotti(criterio) {
    const container = document.getElementById('listaProdotti');
    const prodotti = Array.from(container.children);
    
    prodotti.sort((a, b) => {
        if (criterio === 'nome') {
            const nomeA = a.querySelector('h6').textContent.toLowerCase();
            const nomeB = b.querySelector('h6').textContent.toLowerCase();
            return nomeA.localeCompare(nomeB);
        } else if (criterio === 'quantita') {
            const quantitaA = parseInt(a.querySelector('.quantita').textContent);
            const quantitaB = parseInt(b.querySelector('.quantita').textContent);
            return quantitaB - quantitaA;
        }
        return 0;
    });
    
    // Rimuovi e riaggiungi gli elementi nell'ordine corretto
    prodotti.forEach(prodotto => container.appendChild(prodotto));
}

// Aggiorna la funzione di creazione delle card dei dipendenti
function creaCardDipendente(dipendente) {
    const card = document.createElement('div');
    card.className = 'dipendente-card';
    card.innerHTML = `
        <h6>${dipendente.nome} ${dipendente.cognome}</h6>
        <div class="ruolo">${dipendente.ruolo}</div>
        <div class="stipendio">€${dipendente.stipendio.toFixed(2)}</div>
        <div class="azioni">
            <button class="btn btn-sm btn-outline-primary btn-tooltip" 
                    onclick="modificaDipendente(${dipendente.id})"
                    data-tooltip="Modifica dati dipendente">
                <i class="fas fa-edit"></i> Modifica
            </button>
            <button class="btn btn-sm btn-outline-danger btn-tooltip" 
                    onclick="eliminaDipendente(${dipendente.id})"
                    data-tooltip="Elimina dipendente">
                <i class="fas fa-trash"></i> Elimina
            </button>
        </div>
    `;
    return card;
}

// Aggiorna la funzione di creazione delle card dei prodotti
function creaCardProdotto(prodotto) {
    return `
        <div class="prodotto-card" id="prodotto-${prodotto.id}">
            <div class="prodotto-header">
                <h6 class="prodotto-nome">${prodotto.nome}</h6>
                <span class="prodotto-quantita">
                    <i class="fas fa-box"></i> ${prodotto.quantita}
                </span>
            </div>
            <div class="prodotto-actions">
                <button class="btn btn-outline-primary btn-sm" onclick="modificaProdotto(${prodotto.id})">
                    <i class="fas fa-edit"></i> Modifica
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="eliminaProdotto(${prodotto.id})">
                    <i class="fas fa-trash"></i> Elimina
                </button>
            </div>
        </div>
    `;
}

function modificaProdotto(id) {
    const prodotto = state.prodotti.find(p => p.id === id);
    if (!prodotto) return;
    
    // Popola il form con i dati del prodotto
    document.getElementById('nomeProdotto').value = prodotto.nome;
    document.getElementById('quantita').value = prodotto.quantita;
    
    // Cambia il testo del pulsante submit
    const submitButton = document.querySelector('#prodottoForm button[type="submit"]');
    submitButton.innerHTML = '<i class="fas fa-save me-2"></i>Salva Modifiche';
    
    // Rimuovi il prodotto dalla lista
    state.prodotti = state.prodotti.filter(p => p.id !== id);
    localStorage.setItem('prodotti', JSON.stringify(state.prodotti));
    aggiornaListaProdotti();
}

function eliminaProdotto(id) {
    if (confirm('Sei sicuro di voler eliminare questo prodotto?')) {
        state.prodotti = state.prodotti.filter(p => p.id !== id);
        localStorage.setItem('prodotti', JSON.stringify(state.prodotti));
        aggiornaListaProdotti();
    }
} 