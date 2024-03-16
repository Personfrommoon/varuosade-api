const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const app = express();
const results = [];
const itemsPerPage = 30;

fs.createReadStream('./LE.txt')
    .pipe(csv({
        headers: ["id", "name", "storage1", "storage2", "storage3", "storage4", "storage5", "storage6", "price", "model", "finalPrice"],
        separator: "\t"
    }))
    .on('data', (data) => {
        results.push(data);
    });

function search(query) {
    const filteredResults = results.filter(item => {
        return item.name.toLowerCase().includes(query.toLowerCase()) || 
               item.price.toLowerCase().includes(query.toLowerCase()) || 
               (parseInt(item.storage1) > 0 || parseInt(item.storage2) > 0 || parseInt(item.storage3) > 0 || parseInt(item.storage4) > 0 || parseInt(item.storage5) > 0 || parseInt(item.storage6) > 0);
    });

    let htmlResults = "<ul>";
    filteredResults.forEach(item => {
        let inStock = false;
        if (
            parseInt(item.storage1) > 0 || 
            parseInt(item.storage2) > 0 || 
            parseInt(item.storage3) > 0 || 
            parseInt(item.storage4) > 0 || 
            parseInt(item.storage5) > 0 || 
            parseInt(item.storage6) > 0
        ) {
            inStock = true;
        }
        htmlResults += `<li>Name: ${item.name}, Model: ${item.model}, Price: ${item.finalPrice}, In Stock: ${inStock ? 'Yes' : 'No'}</li>`;
    });
    htmlResults += "</ul>";

    return htmlResults;
}


// home page
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});


// parts in stock with search
app.get('/search', function (req, res) {
    const query = req.query.partName;
    if (!query) {
        return res.send('No query specified');
    }
    const searchResults = search(query);
    res.send(searchResults);
});

// every part that has been/is in storage
app.get('/spare-parts-all', function (req, res) {
    let html = '<html><head><title>Spare Parts</title></head><body><h1>Spare Parts</h1><ul>';
    results.forEach(part => {
        let inStock = false;
        if (
            parseInt(part.storage1) > 0 || 
            parseInt(part.storage2) > 0 || 
            parseInt(part.storage3) > 0 || 
            parseInt(part.storage4) > 0 || 
            parseInt(part.storage5) > 0 || 
            parseInt(part.storage6) > 0
        ) {
            inStock = true;
        }
        html += `<li>Name: ${part.name}, Price: ${part.price}, In Stock: ${inStock ? 'Yes' : 'No'}</li>`;
    });
    html += '</ul></body></html>';
    res.send(html);
});


// spare parts 30 on a page
app.get('/spare-parts', function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const sortOrder = req.query.sort || 'asc'; 
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = page * itemsPerPage;
    const totalPages = Math.ceil(results.length / itemsPerPage);

    let itemsOnPage = results.slice(startIndex, endIndex);

    if (sortOrder === 'asc') {
        itemsOnPage.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortOrder === 'desc') {
        itemsOnPage.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Spare Parts</title>
        </head>
        <body>
            <h1>Spare Parts</h1>
            <ul>
    `;
    itemsOnPage.forEach(item => {
        let inStock = false;
        if (
            parseInt(item.storage1) > 0 || 
            parseInt(item.storage2) > 0 || 
            parseInt(item.storage3) > 0 || 
            parseInt(item.storage4) > 0 || 
            parseInt(item.storage5) > 0 || 
            parseInt(item.storage6) > 0
        ) {
            inStock = true;
        }
        html += `<li>Name: ${item.name}, Model: ${item.model}, In stock: ${inStock ? 'Yes' : 'No'}, Price: ${item.finalPrice} </li>`;
    });
    html += `
            </ul>
    `;

    let nextPage = null; 
    if (page < totalPages) 
    { nextPage = `/spare-parts?page=${page + 1}`; } 

    if (page < totalPages) 
    { lastPage = `/spare-parts?page=${page - 1}`; }

    // go to prev page btn
    if (lastPage) { html += `<a href="${lastPage}"><button>Last Page</button></a>`; } 
    // go to next page btn
    if (nextPage) { html += `<a href="${nextPage}"><button>Next Page</button></a>`; }
 
    html += `
        <div>
            <a href="/spare-parts?sort=asc"><button>Sort by Price (Low to High)</button></a>
            <a href="/spare-parts?sort=desc"><button>Sort by Price (High to Low)</button></a>
        </div>
    `;

    html += `
        </body>
        </html>
    `;
    res.send(html);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});