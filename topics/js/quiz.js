var data = [];
var questionList = [];
var nextQuestion = 0;
var index = 0;
var noCorrect = 0;
var noTotal = 0;
var lastAnswer = 0;

$(document).ready(function() {
    
    $.getJSON('js/quizData.json', function(alldata) {
        $.each(alldata, function(index, item) {
            
            var dataItem = {};
            dataItem['answer'] = []
            
            $.each(item, function(attr, field) {
                
                if(attr == 'question')
                    dataItem['question'] = field;
                if(attr == 'answers') {
                    $.each(field, function(ind, answer) {
                       dataItem['answer'].push(answer); 
                    });
                }
                if(attr == 'info')
                    dataItem['info'] = field;
                if(attr == 'correct')
                    dataItem['correct'] = field;
            });
            
            data.push(dataItem);
        });
    });
    $('#button-start').css('display','block');
});

function startQuiz() {
    $('#button-start').css('display','none');
    $('#answer1').css('display','block');
    $('#answer2').css('display','block');
    $('#answer3').css('display','block');
    $('#next').css('display','block');
    $('.answer-img').css('display','block');
    $('#stats').css('display','block');
    
    noTotal = 0;
    noCorrect = 0;
    nextQuestion = 0;
    for(var i = 0;i <= data.length;++i)
        questionList.push(i);
    for(var i = 0;i <= 100;++i) {
        var index1 = Math.floor(Math.random() * data.lenght);
        var index2 = Math.floor(Math.random() * data.length);
        var aux = questionList[index1];
        questionList[index1] = questionList[index2];
        questionList[index2] = aux;
    }
    
    newQuestion();
}

function endQuiz() {
    $('#button-start').css('display','block');
    $('#answer1').css('display','none');
    $('#answer2').css('display','none');
    $('#answer3').css('display','none');
    $('#next').css('display','none');
    $('.answer-img').css('display','none');
    $('#stats').css('display','block');
    $('#question').html('That`s all!');
}

function newQuestion() {
    if(nextQuestion == data.length) {
        endQuiz();
        return;
    }
    
    if(lastAnswer == 1)
        ++noCorrect;
    lastAnswer = 0;
    index = questionList[nextQuestion++];
    
    var procent = noTotal == 0 ? 0 : Math.floor(noCorrect / noTotal * 100);
    
    $('#stats').html('<h4>Your score: ' + noCorrect + '/' + noTotal +
        ' ' + procent + '% </h4>');
    $('.answer').css('background-color','white');
    $('#question').html( (noTotal + 1) + '. ' + data[index]['question']);
    $('#answer1').html(data[index]['answer'][0]);
    $('#answer2').html(data[index]['answer'][1]);
    $('#answer3').html(data[index]['answer'][2]);
    $('#info').html('<img src="img/question2.png"></img>');
    
    $('#answer1:hover').css('background-color','#33C');
    
    ++noTotal;
}

function checkAnswer(answer, buttonId) {
    $('.answer').css('background-color','white');
    
    if(data[index]['correct'] == answer) {
        $(buttonId).css('background-color','#72EB6F');
        $('#info').html(data[index]['info']);
        ++lastAnswer;
    }
    else {
        $(buttonId).css('background-color','#FF6D5A');
        $('#info').html(data[index]['info']);
        lastAnswer = -999;
    }
    
}

function checkAnswer1() {
    checkAnswer( $('#answer1').html(), '#answer1' )
}

function checkAnswer2() {
    checkAnswer( $('#answer2').html(), '#answer2' )
}

function checkAnswer3() {
    checkAnswer( $('#answer3').html(), '#answer3' )
}