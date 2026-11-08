<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes & Task Scheduler
|--------------------------------------------------------------------------
*/

// Check pre-order reminders every minute for H-10 alarm dispatching
Schedule::command('servora:dispatch-preorders')->everyMinute();
