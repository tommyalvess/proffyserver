import {Response, Request} from 'express';

import db from '../db/connection';
import convertHourToMinutes from '../utils/covertHoursToMinutes';

interface ScheduleItem {
    week_day: number, 
    from: string,
    to: string
}

export default class ClassesController {

    async index(request: Request, response: Response){
        const filters = request.query;

        if(!filters.week_day || !filters.subject || !filters.time){
            return response.status(401).json({
                error: 'Compa de filtro está vazio!'
            });
        }

        const timeInMinutes = convertHourToMinutes(filters.time as string);
        //Um where para garantir que exista na tabela o que estamos procurando
        const classes = await db('classes')
            .whereExists(function () {
                this.select('class_schedule.*')
                .from('class_schedule')
                .whereRaw('`class_schedule`.`class_id` = `classes`.`id`')
                .whereRaw('`class_schedule`.`week_day` = ??', [Number(filters.week_day as string)])
                .whereRaw('`class_schedule`.`from` <= ??', [timeInMinutes])
                .whereRaw('`class_schedule`.`to` > ??', [timeInMinutes])
            })
            .where('classes.subject', '=', filters.subject as string)
            .join('users', 'classes.id', '=', 'users.id')
            .select(['classes.*', 'users.*']);
        
        return response.json(classes);

    }

    async create(request: Request, response: Response) {
        const {
            name,
            avatar,
            whatsapp,
            bio,
            subject,
            cost,
            schedule
        } = request.body;
    
        const trx = await db.transaction();
    
        try {
            const insertedUsersIds = await trx('users').insert({
                name,
                avatar,
                whatsapp,
                bio
            });
        
            const user_id = insertedUsersIds[0];
        
            const insertedClassesIds = await trx('classes').insert({
                subject,
                cost,
                user_id
            });
        
            const class_id = insertedClassesIds[0];
        
            const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
                return {
                    class_id,
                    week_day: scheduleItem.week_day,
                    from: convertHourToMinutes(scheduleItem.from),
                    to: convertHourToMinutes(scheduleItem.to)
                };
            })
        
            await trx('class_schedule').insert(classSchedule);
        
            await trx.commit();
        
            return response.status(201).send();
        } catch (err) {
    
            await trx.rollback();
    
            return response.status(400).json({
                error: 'Opsssss! Algo deu errado!'
            })
        }    
    }


}