import { Injectable } from "@nestjs/common";
import { inngest } from "src/configs/inngest.config";
import { UsersService } from "src/users/users.service";

@Injectable()
export class InngestService {
    constructor(private readonly usersService: UsersService) { }

    getFunctions() {
        // Inngest function to save user data to a database
        const syncUserCreation = inngest.createFunction(
            { id: 'sync-user-from-clerk' },
            { event: 'clerk/user.created' },
            async ({ event }) => {
                const { id, first_name, last_name, email_addresses, image_url } = event.data;
                const userData = {
                    _id: id,
                    email: email_addresses[0].email_address,
                    name: first_name + ' ' + last_name,
                    image: image_url,
                };
                try {
                    const user = await this.usersService.create(userData);
                    console.log('User created successfully:', user);
                    return { success: true, userId: user._id };
                } catch (error) {
                    console.error('Error creating user:', error);
                    throw error;
                }
            }
        );

        // Inngest function to delete a user from database
        const syncUserDeletion = inngest.createFunction(
            { id: 'delete-user-with-clerk' },
            { event: 'clerk/user.deleted' },
            async ({ event }) => {
                const { id } = event.data
                try {
                    await this.usersService.delete(id);
                    console.log('User deleted successfully: ', id);
                    return { success: true, userId: id }
                } catch (error) {
                    console.error('Error deleting user: ', error);
                    throw error;
                }
            }
        );

        // Inngest function to update user in database
        const syncUserUpdate = inngest.createFunction(
            { id: 'update-user-with-clerk' },
            { event: 'clerk/user.updated' },
            async ({ event }) => {
                const { id, first_name, last_name, email_addresses, image_url } = event.data;
                const userData = {
                    _id: id,
                    email: email_addresses[0].email_address,
                    name: first_name + ' ' + last_name,
                    image: image_url,
                };
                try {
                    const user = await this.usersService.update(id, userData);
                    console.log('User updated successfully:', user);
                    return { success: true, userId: user._id };
                } catch (error) {
                    console.error('Error updating user:', error);
                    throw error;
                }
            }
        );
        return [syncUserCreation, syncUserDeletion, syncUserUpdate];
    }
}