import express from "express";
import {promises as fs} from "fs";
import {send} from "process";

const {readFile, writeFile} = fs;
const router = express.Router();

router.post("/", async (req, res, next) => {
    try{
        let grade = req.body;
        if (!grade.student || !grade.subject ||!grade.type || grade.value === null ) {
            throw new Error("Student, Subject, Type e value são obrigatórios");
        }
        const data = JSON.parse(await readFile(`./database-json/${global.fileName}`));

        grade = {
            id: data.nextId++,
            student: grade.student,
            subject: grade.subject,
            type: grade.type,
            value: grade.value,
            timestamp: (new Date()).toISOString()
        };

        data.grades.push(grade);
        await writeFile(`./database-json/${global.fileName}`, JSON.stringify(data));
        res.send(grade);
        global.logger.info(`POST /grades - ${JSON.stringify(grade)}`);

        //{"id":1,"student":"Loiane Groner","subject":"01 - JavaScript","type":"Fórum","value":15,"timestamp":"2020-05-19T18:21:24.958Z"}

    }catch(err) {
        next(err);
    }

});

router.get("/", async (req, res, next) =>{
    try{
        const data = JSON.parse(await readFile(`./database-json/${global.fileName}`));
        delete data.nextId;
        res.send(data);
        global.logger.info(`GET /grades`);
    }catch(err) {
        next(err);
    }
});

router.get("/:id", async (req, res, next) => {
    try{
        const data = JSON.parse(await readFile(`./database-json/${global.fileName}`));
        const grade = data.grades.find((grade) => {
            return grade.id === parseInt(req.params.id);
        });
        
        res.send(grade);
        global.logger.info(`GET /grades/:id`);
    } catch(err) {
        next(err);
    }
});


router.put("/", async (req, res, next) => {
    try {
        const data =JSON.parse(await readFile(`./database-json/${global.fileName}`));
        const grade = req.body;
        if (!grade.id || !grade.student || !grade.subject || !grade.type || grade.value == null) {
            throw new Error("Id, Student, Subject, Type e value são obrigatórios");
        }
        const index = data.grades.findIndex((gr) => gr.id === grade.id);
    
        if (index === -1) {
            throw new Error("Registro não encontrado!")
        }

        data.grades[index].student = grade.student;
        data.grades[index].subject = grade.subject;
        data.grades[index].type = grade.type;
        data.grades[index].value = grade.value;
    
        await writeFile(`./database-json/${global.fileName}`, JSON.stringify(data));
        res.send(grade);
        global.logger.info(`PUT /grade - ${JSON.stringify(grade)}`);
    } catch (err) {
        next(err)
    }
});

router.delete("/:id", async(req, res, next) => {
    try {
        const data = JSON.parse(await readFile(`./database-json/${global.fileName}`));
        data.grades = data.grades.filter((grade) => {
            return grade.id !== parseInt(req.params.id);
        });
        await writeFile(`./database-json/${global.fileName}`, JSON.stringify(data));
        res.end();

        global.logger.info(`DELETE /grades/:id - ${req.params.id}`);
    } catch (err) {
        next(err);
    }
});


router.get("/notas/:student/:subject", async (req, res, next) => {
    try{
        const data = JSON.parse(await readFile(`./database-json/${global.fileName}`));
        const gradeAluno = data.grades.filter((grade) => {
            return (grade.student.toLowerCase() === req.params.student.toLowerCase() && grade.subject.toLowerCase() === req.params.subject.toLowerCase());
        });

        const sum = gradeAluno.reduce((accumulate, current) => {
            return accumulate + current.value;
        }, 0);
        
        res.send(`Soma das notas da disciplina: ${sum}. Aluno: ${req.params.student}`);
        global.logger.info(`GET /grades/notas`);
    } catch(err) {
        next(err);
    }
});


router.get("/media/:subject/:type", async (req, res, next) => {
    try{
        const data = JSON.parse(await readFile(`./database-json/${global.fileName}`));
        const grade = data.grades.filter((gr) => {
            return (gr.subject.toLowerCase() === req.params.subject.toLowerCase() && gr.type.toLowerCase() === req.params.type.toLowerCase());
        });
        
        const qtd = grade.length;
        const sum = grade.reduce((accumulate, current) => {
            return accumulate + current.value;
        }, 0);
        
        res.send(`Total: ${qtd}  Media: ${sum/qtd} Disciplina: ${req.params.subject}.`);
        global.logger.info(`GET /grades/media`);
    } catch(err) {
        next(err);
    }
});


router.get("/maior-nota/:subject/:type", async (req, res, next) => {
    try{
        const data = JSON.parse(await readFile(`./database-json/${global.fileName}`));
        const grades = data.grades.filter((gr) => {
            return (gr.subject.toLowerCase() === req.params.subject.toLowerCase() && gr.type.toLowerCase() === req.params.type.toLowerCase());
        });
        
        grades.sort((a, b) => {
            return b.value - a.value;
        });
        
        res.send(grades.slice(0, 3));
        global.logger.info(`GET /grades/maior-nota`);
    } catch(err) {
        next(err);
    }
});

router.patch("/alter-valor", async (req, res, next) => {
    try {
      const data = JSON.parse(await readFile(`./database-json/${global.fileName}`));
      const grade = req.body;
      const index = data.grades.findIndex((a) => a.id === grade.id);
      
      if (!grade.id || grade.value == null) {
          throw new Error("Id e value são obrigatórios");
      } 
  
      if (index === -1) {
          throw new Error("Registro não encontrado!")
      }
  
      data.grades[index].value = grade.value;

      await writeFile(`./database-json/${global.fileName}`, JSON.stringify(data));
      res.send(data.grades[index]);
      global.logger.info(`PATCH /account - ${JSON.stringify(grade)}`);
    } catch (err) {
      next(err);
    }
  });
  
router.use((err, req, res, next) => {
    global.logger.error(`${req.method} ${req.baseUrl} ${err.message}`);
    res.status(400).send({error: err.message});
});


export default router;
