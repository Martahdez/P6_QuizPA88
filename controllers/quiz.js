const Sequelize = require("sequelize");
const {models} = require("../models");

// Autoload the quiz with id equals to :quizId
exports.load = (req, res, next, quizId) => {

    models.quiz.findById(quizId)
    .then(quiz => {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    })
    .catch(error => next(error));
};


// GET /quizzes
exports.index = (req, res, next) => {

    models.quiz.findAll()
    .then(quizzes => {
        res.render('quizzes/index.ejs', {quizzes});
    })
    .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "", 
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const {question, answer} = req.body;

    const quiz = models.quiz.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz created successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/new', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error creating a new Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const {quiz, body} = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
    .then(() => {
        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');
    })
    .catch(error => {
        req.flash('error', 'Error deleting the Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};

exports.randomplay = (req, res, next) => {
//1) me tengo que guardar las preguntas de la base de datos en un array
//2)tengo que mostrar una pregunta aleatoria, eliminarla
//3)Si esta bien respondida aumentar la puntuacion y seguir preguntando
//4)Si esta mal respondida finalizar el juego sacando puntuacion
//5)Guardamos el estado para saber cuantas y cuales preguntas hemos hecho
//6)Comprobar si he respondido a todas--- saco la puntuacion final
//7)La puntuacion sera el tamaño de las preguntas acertadas que te guardas

//Lo primero que hago es recuperar los quizzes de la sesion o lo inicializamos a cero

    exports.randomplay = (req, res, next) => {

        req.session.randomPlay = req.session.randomPlay || []; //Si esta vacio lo ponemos
        const op = Sequelize.Op;
        //buscamos el id
        const whereOp = {id: {[op.notIn]: req.session.randomPlay}};

        models.quiz.count({where:whereOp})
            .then(count => {
                //SI no hay quizzes
                if(count===0){
                    const score = req.session.randomPlay.length;
                    //Reseteamos random play
                    req.session.randomPlay = [];
                    //Redenderizamos la vista
                    res.render('quizzes/random_none',{score});
                }
                return models.quiz.findAll({
                    where: whereOp,
                    offset: Math.floor(count*Math.random()),
                    limit: 1
                })
                    .then(quizzes => {
                        return quizzes[0];
                    });
            })
            .then(quiz =>{
                const score = req.session.randomPlay.length;
                res.render('quizzes/random_play',{quiz, score});
            })
            .catch(error => {
                next(error);
            });
    };
//Los pasos 3 y 4 los hago con el metodo randomcheck
exports.randomcheck = (req,res,next)=>{
//Este metodo se utiliza para comprobar el otro

    const {quiz, query} = req;
    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();
    const score = req.session.randomplay.length + result; //Devuelvo el numero de respuestas acertadas
    if(result===1){ //Si he acertado la respuesta
        // score++;
        req.session.randomplay.push(quiz.id); //La añado al array de respuestas acertadas
    } else { //Si fallamos hay que resetear el array de respuestas acertadas
        req.session.randomplay=[];
    }

    res.render('quizzes/random_result', { //para que pase a otra pag web
        answer,
        result,
        score
    });
}

// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const {quiz, query} = req;
    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', { //para que pase a otra pag web
        quiz,
        result,
        answer
    });
};


