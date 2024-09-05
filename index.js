const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const app = express();
const results = [];
const itemsPerPage = 30;

// CSV shit
fs.createReadStream('./LE.txt')
    .pipe(csv({
        headers: ["id", "name", "storage1", "storage2", "storage3", "storage4", "storage5", "storage6", "price", "model", "finalPrice"],
        separator: "\t"
    }))
    .on('data', (data) => {
        results.push(data);
    });

// Lic localhost:3000
app.get('/', function (req, res) {
    res.json({ message: 'Welcome to the Spare Parts API' });
});

// Otsingu func
function search(query) {
    return results.filter(item => {
        const nameMatch = item.name && item.name.toLowerCase().includes(query.toLowerCase());
        const priceMatch = item.price && item.price.toLowerCase().includes(query.toLowerCase());
        return nameMatch || priceMatch;
    });
}

// Otsing
app.get('/search', function (req, res) {
    const query = req.query.partName;
    
    if (!query || query.trim() === '') {
        return res.status(400).json({ error: 'No query specified' });
    }

    const searchResults = search(query);
    
    if (searchResults.length === 0) {
        return res.status(404).json({ error: 'No parts found for the given query' });
    }

    const jsonResults = searchResults.map(item => {  
        return {
            name: item.name,
            id: item.id,
            price: item.price,
            finalPrice: item.finalPrice,
            model: item.model,
            storage1: item.storage1,
            storage2: item.storage2,
            storage3: item.storage3,
            storage4: item.storage4,
            storage5: item.storage5,
            storage6: item.storage6
        };
    });

    res.json(jsonResults);
});

// Kõik jupid ühel lehel (localhost:3000/spare-parts-all)
app.get('/spare-parts-all', function (req, res) {
    const jsonParts = results.map(part => {
        return {
            name: part.name,
            id: part.id,
            price: part.price,
            finalPrice: part.finalPrice,
            model: part.model,
            storage1: part.storage1,
            storage2: part.storage2,
            storage3: part.storage3,
            storage4: part.storage4,
            storage5: part.storage5,
            storage6: part.storage6
        };
    });
    res.json(jsonParts);
});

// 30 juppi lehel (localhost:3000/spare-parts, localhost:3000/spare-parts?name=... , localhost:3000/spare-parts?sort=asc/desc, localhost:3000/spare-parts?page=2)
app.get('/spare-parts', function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const sortOrder = req.query.sort || 'asc';
    const nameQuery = req.query.name ? req.query.name.toLowerCase() : null; 

    let filteredResults = results;
    if (nameQuery) {
        filteredResults = filteredResults.filter(item => item.name && item.name.toLowerCase().includes(nameQuery));
    }

    const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;

    let itemsOnPage = filteredResults.slice(startIndex, endIndex);

    if (sortOrder === 'asc') {
        itemsOnPage.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortOrder === 'desc') {
        itemsOnPage.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    const jsonPageResults = itemsOnPage.map(item => {
        return {
            name: item.name,
            id: item.id,
            price: item.price,
            finalPrice: item.finalPrice,
            model: item.model,
            storage1: item.storage1,
            storage2: item.storage2,
            storage3: item.storage3,
            storage4: item.storage4,
            storage5: item.storage5,
            storage6: item.storage6
        };
    });

    let nextPage = page < totalPages ? `/spare-parts?page=${page + 1}&name=${nameQuery || ''}` : null;
    let lastPage = page > 1 ? `/spare-parts?page=${page - 1}&name=${nameQuery || ''}` : null;

    res.json({
        currentPage: page,
        totalPages: totalPages,
        items: jsonPageResults,
        nextPage: nextPage,
        lastPage: lastPage,
        sortOrder: sortOrder
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
