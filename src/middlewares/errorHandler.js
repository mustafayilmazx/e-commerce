const errorHandler = (err, req, res, next) => {
    
    console.log(err.message);

    if (err.code === 11000) {
        return res.json(
            {
                mesaj: Object.keys(err.keyValue) +" için girdiğiniz "+ Object.values(err.keyValue) +" daha önceden veritabanında olduğu için tekrar eklenemez/güncenllenemez, unique olmalıdır",

                hataKodu: 400
            }
        )
    }
    if (err.code === 66) { 
        return res.json({
            mesaj: "Değiştirilemez bir alanı güncellemeye çalıştınız",
            hataKodu :400
        })
    }

    res.status(err.statusCode || 500);
   
    const hatalarDizisi = [];
    //joi hataları için
    if (err.details && err.details instanceof Array) {
        for (let mesaj of err.details)
            hatalarDizisi.push(mesaj.message);
    } else if(err.errors && err.errors instanceof Object) {
        
        for (let key in err.errors) {
            hatalarDizisi.push(err.errors[key].message);
        }  
    } else {
        hatalarDizisi.push(err.message);
    }
    res.json({
        hataKodu: err.statusCode || 500,
        mesaj : hatalarDizisi
    });
   
}

module.exports = errorHandler;