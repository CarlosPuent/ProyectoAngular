import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, AssignRoleRequest } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  assignRole(userId: string, data: AssignRoleRequest): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}/roles`, data);
  }

  removeRole(userId: string, data: AssignRoleRequest): Observable<User> {
    return this.http.delete<User>(`${this.apiUrl}/${userId}/roles`, { body: data });
  }
}